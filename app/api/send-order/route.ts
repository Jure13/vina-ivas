import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { customer, cart, orderId } = await req.json();

    if (!customer?.email) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
    }

    console.log("Attempting to send email to:", customer.email);
    console.log("SMTP Config:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      // Don't log password
    });

    // Fixed: createTransport (not createTransporter)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: { 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS 
      },
    });

    // Test connection first
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
      return NextResponse.json({ 
        error: "SMTP connection failed", 
        details: verifyError 
      }, { status: 500 });
    }

    const itemsHtml = cart
      .map(
        (item: any) => `
        <tr>
          <td style="padding:8px; border-bottom:1px solid #ddd;">${item.name}</td>
          <td style="padding:8px; text-align:center; border-bottom:1px solid #ddd;">${item.quantity}</td>
          <td style="padding:8px; text-align:right; border-bottom:1px solid #ddd;">€${item.price.toFixed(2)}</td>
          <td style="padding:8px; text-align:right; border-bottom:1px solid #ddd;">€${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const total = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

    const emailHtml = (recipient: "customer" | "winery") => `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin:auto;">
        <div style="text-align:center; margin-bottom:20px;">
          <img src="https://www.vina-ivas.hr/logo.png" alt="Vina Ivas" style="height: 80px;" />
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
          </tbody>
        </table>

        <p style="text-align:right; font-weight:bold; font-size:16px; margin-top:10px;">Ukupno: €${total.toFixed(2)}</p>

        ${
          recipient === "customer"
            ? `<p>Vaša narudžba će uskoro biti obrađena i poslana.</p>`
            : `<h3>Podaci kupca:</h3>
               <p style="font-size:14px; line-height:1.5;">
                 ${customer.firstName} ${customer.lastName}<br/>
                 ${customer.email}<br/>
                 ${customer.phone}<br/>
                 ${customer.address}, ${customer.postalCode} ${customer.city}, ${customer.country}<br/>
                 ${customer.notes ? `Napomene: ${customer.notes}` : ""}
               </p>`
        }

        <p style="font-size:12px; color:#777; margin-top:20px;">Ovo je automatski generirana poruka sa web stranice Vina Ivas.</p>
      </div>
    `;

    console.log("Sending customer email...");
    // Customer email
    const customerEmailResult = await transporter.sendMail({
      from: `"Vina Ivas" <${process.env.SMTP_USER}>`,
      to: customer.email,
      subject: `Vaša narudžba #${orderId} potvrđena`,
      html: emailHtml("customer"),
    });
    console.log("Customer email sent:", customerEmailResult.messageId);

    console.log("Sending winery email...");
    // Winery email
    const wineryEmailResult = await transporter.sendMail({
      from: `"Vina Ivas" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: `Nova narudžba #${orderId}`,
      html: emailHtml("winery"),
    });
    console.log("Winery email sent:", wineryEmailResult.messageId);

    return NextResponse.json({ 
      success: true, 
      customerEmailId: customerEmailResult.messageId,
      wineryEmailId: wineryEmailResult.messageId 
    });

  } catch (error: any) {
    console.error("Email sending error:", error);
    return NextResponse.json({ 
      error: "Failed to send email", 
      details: error.message 
    }, { status: 500 });
  }
}