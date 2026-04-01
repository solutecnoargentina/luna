module.exports = {
  apps: [
    {
      name: 'solutecno-bot-oneuser',
      script: './server.js',
      cwd: '/opt/solutecno-whatsapp-bot',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PORT: 3000
      }
    }
  ]
};
