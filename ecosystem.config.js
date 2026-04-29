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
      SMTP_HOST: 'smtp.sendgrid.net',
      SMTP_PORT: 587,
      SMTP_USER: 'apikey',
      // SMTP_PASS: set this on the server — do not commit the SendGrid API key
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
  }],
};
