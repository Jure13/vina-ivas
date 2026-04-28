import nodemailer from "nodemailer";
import { serverConfig } from "./config";

interface EmailJob {
  to: string;
  subject: string;
  html: string;
  retries?: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmailWithRetry(job: EmailJob): Promise<boolean> {
  const transporter = nodemailer.createTransport({
    host: serverConfig.smtp.host,
    port: serverConfig.smtp.port,
    secure: true,
    auth: {
      user: serverConfig.smtp.user,
      pass: serverConfig.smtp.pass,
    },
  });

  const attempt = (job.retries ?? 0) + 1;

  try {
    await transporter.sendMail({
      from: `"Vina Ivas" <${serverConfig.smtp.user}>`,
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
