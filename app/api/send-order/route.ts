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

    const { customer, cart, orderId, deliveryFee = 0, total, language = "hr" } = validation.data;

    if (!process.env.SMTP_PASS) {
      console.error("SendGrid API key (SMTP_PASS) not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const emailStrings = {
      hr: {
        subject: `Vaša narudžba #${orderId} potvrđena`,
        greeting: "Hvala na narudžbi!",
        processed: "Vaša narudžba će uskoro biti obrađena i poslana.",
        product: "Proizvod",
        quantity: "Količina",
        price: "Cijena",
        total: "Ukupno",
        delivery: "Dostava",
        footer: "Ovo je automatski generirana poruka sa web stranice Vina Ivas.",
      },
      en: {
        subject: `Your order #${orderId} confirmed`,
        greeting: "Thank you for your order!",
        processed: "Your order will be processed and shipped shortly.",
        product: "Product",
        quantity: "Quantity",
        price: "Price",
        total: "Total",
        delivery: "Delivery",
        footer: "This is an automatically generated message from the Vina Ivas website.",
      },
      de: {
        subject: `Ihre Bestellung #${orderId} bestätigt`,
        greeting: "Vielen Dank für Ihre Bestellung!",
        processed: "Ihre Bestellung wird in Kürze bearbeitet und versandt.",
        product: "Produkt",
        quantity: "Menge",
        price: "Preis",
        total: "Gesamt",
        delivery: "Lieferung",
        footer: "Dies ist eine automatisch generierte Nachricht der Website Vina Ivas.",
      },
    } as const;

    const s = emailStrings[language];
    const sHr = emailStrings.hr;

    const calculatedTotal =
      total ?? cart.reduce((sum, i) => sum + i.price * i.quantity, 0) + deliveryFee;

    const buildItemsHtml = () =>
      cart
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

    const buildDeliveryHtml = (strings: typeof s) =>
      deliveryFee > 0
        ? `<tr>
            <td style="padding:8px; border-bottom:1px solid #ddd;" colspan="3"><strong>${strings.delivery}</strong></td>
            <td style="padding:8px; text-align:right; border-bottom:1px solid #ddd;">€${deliveryFee.toFixed(2)}</td>
          </tr>`
        : "";

    const buildEmailHtml = (recipient: "customer" | "winery", strings: typeof s) => `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin:auto;">
        <div style="text-align:center; margin-bottom:20px;">
          <img src="https://www.vina-ivas.hr/slike/logo.png" alt="Vina Ivas" style="height: 80px;" />
        </div>
        <h2 style="color:#8B0000;">${recipient === "customer" ? strings.greeting : "Nova narudžba"}</h2>
        <p>Order ID: <strong>#${orderId}</strong></p>

        <table style="width:100%; border-collapse: collapse; margin-top: 15px; font-size:14px;">
          <thead>
            <tr style="background-color:#f2f2f2;">
              <th style="text-align:left; padding:8px;">${strings.product}</th>
              <th style="text-align:center; padding:8px;">${strings.quantity}</th>
              <th style="text-align:right; padding:8px;">${strings.price}</th>
              <th style="text-align:right; padding:8px;">${strings.total}</th>
            </tr>
          </thead>
          <tbody>
            ${buildItemsHtml()}
            ${buildDeliveryHtml(strings)}
          </tbody>
        </table>

        <p style="text-align:right; font-weight:bold; font-size:16px;">${strings.total}: €${calculatedTotal.toFixed(2)}</p>

        ${
          recipient === "customer"
            ? `<p>${strings.processed}</p>`
            : `<h3>Podaci kupca:</h3>
               <p style="font-size:14px; line-height:1.5;">
                 ${escapeHtml(customer.firstName)} ${escapeHtml(customer.lastName)}<br/>
                 ${escapeHtml(customer.email)}<br/>
                 ${escapeHtml(customer.phone)}<br/>
                 ${escapeHtml(customer.address)}, ${escapeHtml(customer.postalCode)} ${escapeHtml(customer.city)}, ${escapeHtml(customer.customCountry || customer.country)}<br/>
                 ${customer.notes ? `Napomene: ${escapeHtml(customer.notes)}` : ""}
               </p>`
        }

        <p style="font-size:12px; color:#777; margin-top:20px;">${strings.footer}</p>
      </div>
    `;

    const [customerSuccess, winerySuccess] = await Promise.all([
      sendEmailWithRetry({
        to: customer.email,
        subject: s.subject,
        html: buildEmailHtml("customer", s),
      }),
      sendEmailWithRetry({
        to: 'kontakt@vina-ivas.hr',
        subject: `Nova narudžba #${orderId}`,
        html: buildEmailHtml("winery", sHr),
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
