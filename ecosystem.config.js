module.exports = {
  apps: [{
    name: 'vina-ivas',
    script: 'npm',
    args: 'start',
    cwd: '/home/vinaivas/vina-ivas',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      // SMTP non-secrets are in .env.production (committed to git)
      // SMTP_PASS must be set here — replace with your actual SendGrid API key
      SMTP_PASS: 'REPLACE_WITH_SENDGRID_API_KEY',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
  }],
};
