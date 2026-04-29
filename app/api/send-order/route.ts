import { NextRequest, NextResponse } from "next/server";
import { sendOrderSchema } from "@/app/lib/validation";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/app/lib/rateLimit";
import { sendEmailWithRetry } from "@/app/lib/emailQueue";

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const { limited } = rateLimit(`send-order:${clientIp}`, 5, 60 * 60 * 1000);

    if (limited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = sendOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { customer, cart, orderId, deliveryFee = 0, total } = validation.data;

    if (!process.env.SMTP_PASS) {
      console.error("SendGrid API key (SMTP_PASS) not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const calculatedTotal =
      total ?? cart.reduce((sum, i) => sum + i.price * i.quantity, 0) + deliveryFee;

    const itemsHtml = cart
      .map(
        (item) => `
        <tr>
          <td style="padding:8px; border-bottom:1px solid #ddd;">${escapeHtml(item.name)}</td>
          <td style="padding:8px; text-align:center; border-bottom:1px solid #ddd;">${item.quantity}</td>
          <td style="padding:8px; text-align:right; border-bottom:1px solid #ddd;">€${item.price.toFixed(2)}</td>
          <td style="padding:8px; text-align:right; border-bottom:1px solid #ddd;">€${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const deliveryHtml =
      deliveryFee > 0
        ? `<tr>
            <td style="padding:8px; border-bottom:1px solid #ddd;" colspan="3"><strong>Dostava</strong></td>
            <td style="padding:8px; text-align:right; border-bottom:1px solid #ddd;">€${deliveryFee.toFixed(2)}</td>
          </tr>`
        : "";

    const emailHtml = (recipient: "customer" | "winery") => `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin:auto;">
        <div style="text-align:center; margin-bottom:20px;">
          <img src="https://www.vina-ivas.hr/slike/logo.png" alt="Vina Ivas" style="height: 80px;" />
        </div>
        <h2 style="color:#8B0000;">${recipient === "customer" ? "Hvala na narudžbi!" : "Nova narudžba"}</h2>
        <p>Order ID: <strong>#${orderId}</strong></p>

        <table style="width:100%; border-collapse: collapse; margin-top: 15px; font-size:14px;">
          <thead>
            <tr style="background-color:#f2f2f2;">
              <th style="text-align:left; padding:8px;">Proizvod</th>
              <th style="text-align:center; padding:8px;">Količina</th>
              <th style="text-align:right; padding:8px;">Cijena</th>
              <th style="text-align:right; padding:8px;">Ukupno</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            ${deliveryHtml}
          </tbody>
        </table>

        <p style="text-align:right; font-weight:bold; font-size:16px;">Ukupno: €${calculatedTotal.toFixed(2)}</p>

        ${
          recipient === "customer"
            ? `<p>Vaša narudžba će uskoro biti obrađena i poslana.</p>`
            : `<h3>Podaci kupca:</h3>
               <p style="font-size:14px; line-height:1.5;">
                 ${escapeHtml(customer.firstName)} ${escapeHtml(customer.lastName)}<br/>
                 ${escapeHtml(customer.email)}<br/>
                 ${escapeHtml(customer.phone)}<br/>
                 ${escapeHtml(customer.address)}, ${escapeHtml(customer.postalCode)} ${escapeHtml(customer.city)}, ${escapeHtml(customer.customCountry || customer.country)}<br/>
                 ${customer.notes ? `Napomene: ${escapeHtml(customer.notes)}` : ""}
               </p>`
        }

        <p style="font-size:12px; color:#777; margin-top:20px;">Ovo je automatski generirana poruka sa web stranice Vina Ivas.</p>
      </div>
    `;

    const [customerSuccess, winerySuccess] = await Promise.all([
      sendEmailWithRetry({
        to: customer.email,
        subject: `Vaša narudžba #${orderId} potvrđena`,
        html: emailHtml("customer"),
      }),
      sendEmailWithRetry({
        to: 'kontakt@vina-ivas.hr',
        subject: `Nova narudžba #${orderId}`,
        html: emailHtml("winery"),
      }),
    ]);

    if (!customerSuccess || !winerySuccess) {
      console.warn("Some emails failed to send after retries");
    }

    return NextResponse.json({
      success: true,
      emailStatus: {
        customer: customerSuccess,
        winery: winerySuccess,
      },
    });
  } catch (error: unknown) {
    console.error("Email sending error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
