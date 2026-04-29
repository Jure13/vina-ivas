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

export async function sendEmailWithRetry(job: EmailJob): Promise<boolean> {
  const apiKey = process.env.SMTP_PASS;
  if (!apiKey) {
    console.error("SendGrid API key (SMTP_PASS) is not configured");
    return false;
  }

  const attempt = (job.retries ?? 0) + 1;

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: job.to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: job.subject,
        content: [{ type: "text/html", value: job.html }],
      }),
    });

    if (res.ok || res.status === 202) {
      console.log(`Email sent successfully to ${job.to}`);
      return true;
    }

    const errorBody = await res.text();
    throw new Error(`SendGrid ${res.status}: ${errorBody}`);
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
