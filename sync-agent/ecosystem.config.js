module.exports = {
  apps: [
    {
      name: 'iron-gym-sync-agent',
      script: 'index.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
