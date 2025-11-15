module.exports = {
  apps: [
    {
      name: 'vtb25-frontend',
      script: '/home/matmuher/vtb25/frontend/node_modules/.bin/vite',
      args: 'preview --port 3000',
      cwd: '/home/matmuher/vtb25/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
    },
    {
      name: 'vtb25-backend',
      script: '/home/matmuher/vtb25/backend/venv/bin/uvicorn',
      args: 'backend:app --host 0.0.0.0 --port 8000',
      cwd: '/home/matmuher/vtb25',
      instances: 1,
      autorestart: true,
      watch: false,
    }
  ]
};
