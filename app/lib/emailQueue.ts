import nodemailer from "nodemailer";

interface EmailJob {
  to: string;
  subject: string;
  html: string;
  retries?: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;
const FROM_EMAIL = "kontakt@vina-ivas.hr";
const FROM_NAME = "Vina Ivas";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmailWithRetry(job: EmailJob): Promise<boolean> {
  const attempt = (job.retries ?? 0) + 1;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: job.to,
      subject: job.subject,
      html: job.html,
    });

    console.log(`Email sent successfully to ${job.to}`);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Email send failed (attempt ${attempt}/${MAX_RETRIES}):`, message);

    if (attempt < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await sleep(RETRY_DELAY);
      return sendEmailWithRetry({ ...job, retries: attempt });
    }

    console.error(`Email failed after ${MAX_RETRIES} attempts`);
    return false;
  }
}
