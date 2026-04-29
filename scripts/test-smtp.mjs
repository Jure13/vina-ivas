/**
 * Standalone SMTP test — run directly with Node.js on the server.
 * Loads .env.production and .env.production.local without needing Next.js or PM2.
 *
 * Usage (on server):
 *   node scripts/test-smtp.mjs
 *   node scripts/test-smtp.mjs someone@example.com
 */

import { readFileSync, existsSync } from 'fs';
import { createTransport } from 'nodemailer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── env file loader ──────────────────────────────────────────────────────────
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const lines = readFileSync(filePath, 'utf8').split('\n');
  const vars = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

// Load in Next.js precedence order (later overrides earlier)
const envFiles = [
  resolve(root, '.env'),
  resolve(root, '.env.production'),
  resolve(root, '.env.production.local'),
];

for (const f of envFiles) {
  const vars = loadEnvFile(f);
  const loaded = Object.keys(vars).length;
  if (loaded) {
    console.log(`  Loaded ${f.replace(root, '.')} (${loaded} vars)`);
    Object.assign(process.env, vars);
  } else {
    console.log(`  Skipped ${f.replace(root, '.')} (not found or empty)`);
  }
}

// ── print what we have ───────────────────────────────────────────────────────
const host = process.env.SMTP_HOST || '';
const port = Number(process.env.SMTP_PORT) || 0;
const user = process.env.SMTP_USER || '';
const pass = process.env.SMTP_PASS || '';

console.log('\n─── SMTP config ───────────────────────────────────────');
console.log(`  SMTP_HOST : ${host || '❌ NOT SET'}`);
console.log(`  SMTP_PORT : ${port || '❌ NOT SET'}`);
console.log(`  SMTP_USER : ${user || '❌ NOT SET'}`);
console.log(`  SMTP_PASS : ${pass ? `✅ set (${pass.length} chars, starts with ${pass.slice(0, 5)}...)` : '❌ NOT SET'}`);
console.log('───────────────────────────────────────────────────────\n');

if (!host || !port || !user || !pass) {
  console.error('❌ Missing SMTP vars — cannot continue.');
  console.error('   Add missing vars to /home/vinaivas/vina-ivas/.env.production.local');
  process.exit(1);
}

// ── send test email ──────────────────────────────────────────────────────────
const recipient = process.argv[2] || user;
console.log(`Sending test email to: ${recipient}`);

const transporter = createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log('✅ SMTP connection verified');
} catch (err) {
  console.error('❌ SMTP connection failed:', err.message);
  console.error('   Full error:', err);
  process.exit(1);
}

try {
  const info = await transporter.sendMail({
    from: `"Vina Ivas Test" <kontakt@vina-ivas.hr>`,
    to: recipient,
    subject: 'SMTP test — Vina Ivas',
    html: '<p>If you received this, SMTP is working correctly.</p>',
  });
  console.log('✅ Email sent!  Message ID:', info.messageId);
} catch (err) {
  console.error('❌ sendMail failed:', err.message);
  process.exit(1);
}
