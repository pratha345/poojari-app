module.exports = {
  apps: [{
    name:        'dharmasindhu-ocr-gemini',
    script:      '/var/www/pojjari/backend/scripts/ocr_dharmasindhu_gemini.py',
    interpreter: 'python3',
    cwd:         '/var/www/pojjari/backend/scripts',

    autorestart:              true,
    max_restarts:             50,
    min_uptime:               '30s',
    exp_backoff_restart_delay: 10000,

    out_file:    '/var/log/pm2/dharmasindhu-ocr-gemini.log',
    error_file:  '/var/log/pm2/dharmasindhu-ocr-gemini-err.log',
    merge_logs:  true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',

    env: {
      PYTHONUNBUFFERED:       '1',
      DHARMASINDHU_PDF_PATH:  '/var/www/pojjari/frontend/dist/Dharmasindhu Marathi Translation Bapu Sastri Moghe 1886.pdf',
      DB_HOST:                '159.89.167.218',
      DB_PORT:                '3306',
      DB_USER:                'pojjari_user',
      DB_PASSWORD:            'StrongPassword@2024!',
      DB_NAME:                'pojjari_db',
      GEMINI_API_KEY:         'AIzaSyAESh1syc7Dhz-gm_cHuDwTPCVWW9o8gzw',
    }
  }]
};
