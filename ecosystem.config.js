module.exports = {
  apps: [
    {
      name: "vina-ivas",
      script: "npm",
      args: "start",
      env: {
        PORT: 1995,
        NODE_ENV: "production",
      },
    },
  ],
};