// test-smtp.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,       // SSL port
  secure: true,    // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, 
  },
});

async function testSMTP() {
  try {
    const info = await transporter.sendMail({
      from: '"Vina Ivas" <kontakt@vina-ivas.hr>',
      to: "jure.antunovic6@gmail.com",   // my email
      subject: "SMTP Test",
      text: "This is a test email from Node.js",
    });
    console.log("SMTP test succeeded:", info.messageId);
  } catch (error) {
    console.error("SMTP test failed:", error);
  }
}

testSMTP();
