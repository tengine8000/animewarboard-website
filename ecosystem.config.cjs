module.exports = {
  apps: [
    {
      name: "animewarboard",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/Users/mac/Desktop/animewarboard",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
