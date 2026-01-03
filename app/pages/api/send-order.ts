import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { customer, cart, orderId } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const orderRows = cart
      .map(
        (item: any) =>
          `<li>${item.name} x ${item.quantity} = €${(item.price * item.quantity).toFixed(
            2
          )}</li>`
      )
      .join("");

    const total = cart.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

    const wineryHtml = `
      <h1>Nova narudžba #${orderId}</h1>
      <h2>Podaci kupca</h2>
      <p><strong>Ime:</strong> ${customer.firstName} ${customer.lastName}</p>
      <p><strong>Email:</strong> ${customer.email}</p>
      <p><strong>Telefon:</strong> ${customer.phone}</p>
      <p><strong>Adresa:</strong> ${customer.address}, ${customer.postalCode} ${customer.city}, ${customer.country}</p>
      ${customer.notes ? `<p><strong>Napomena:</strong> ${customer.notes}</p>` : ""}
      <h2>Proizvodi</h2>
      <ul>${orderRows}</ul>
      <p><strong>Ukupno:</strong> €${total.toFixed(2)}</p>
    `;

    await transporter.sendMail({
      from: `"Vina Ivas webshop" <${process.env.SMTP_USER}>`,
      to: "kontakt@vina-ivas.hr",
      subject: `Nova narudžba #${orderId}`,
      html: wineryHtml,
    });

    const customerHtml = `
      <h1>Hvala na narudžbi!</h1>
      <p>Poštovani ${customer.firstName},</p>
      <p>Zahvaljujemo što ste naručili vina od Vina Ivas. Vaša narudžba #${orderId} je zaprimljena.</p>
      <h2>Vaša narudžba:</h2>
      <ul>${orderRows}</ul>
      <p><strong>Ukupno:</strong> €${total.toFixed(2)}</p>
      <p>Uskoro ćemo Vas kontaktirati s daljnjim informacijama o dostavi.</p>
      <p>Lijep pozdrav,<br/>Vina Ivas</p>
    `;

    await transporter.sendMail({
      from: `"Vina Ivas webshop" <${process.env.SMTP_USER}>`,
      to: customer.email,
      subject: `Potvrda narudžbe #${orderId}`,
      html: customerHtml,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ error: "Email send failed" });
  }
}