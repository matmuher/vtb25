module.exports = {
  apps: [
    {
      name: 'vtb25-frontend',
      script: './node_modules/.bin/serve',
      args: '-s dist -l 3000',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
    },
    {
      name: 'vtb25-backend',
      script: 'uvicorn',
      args: 'backend:app --host 0.0.0.0 --port 8000',
      interpreter: 'python',
      cwd: '.',
      instances: 1,
      autorestart: true,
      watch: false,
    }
  ]
};
