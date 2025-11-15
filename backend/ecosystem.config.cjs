module.exports = {
  apps: [{
    name: 'vtb25-backend',
    script: 'uvicorn',
    args: 'backend:app --host 0.0.0.0 --port 8000',
    interpreter: 'python',
    cwd: './backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PYTHONPATH: '.'
    }
  }]
};
