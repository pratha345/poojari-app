module.exports = {
  apps: [{
    name:        'dharmasindhu-ocr',
    script:      '/var/www/pojjari/backend/scripts/ocr_dharmasindhu.py',
    interpreter: 'python3',
    cwd:         '/var/www/pojjari/backend/scripts',

    // Restart on crash (non-zero exit), but back off so we don't hammer the API
    autorestart:              true,
    max_restarts:             50,
    min_uptime:               '30s',
    exp_backoff_restart_delay: 10000,   // 10s → 20s → 40s … max ~15 min

    // Logging (PM2 captures stdout/stderr automatically)
    out_file:    '/var/log/pm2/dharmasindhu-ocr.log',
    error_file:  '/var/log/pm2/dharmasindhu-ocr-err.log',
    merge_logs:  true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',

    // Environment variables for the script
    env: {
      PYTHONUNBUFFERED:       '1',     // Print output immediately (no buffering)
      DHARMASINDHU_PDF_PATH:  '/var/www/pojjari/frontend/dist/Dharmasindhu Marathi Translation Bapu Sastri Moghe 1886.pdf',
      DB_HOST:                '159.89.167.218',
      DB_PORT:                '3306',
      DB_USER:                'pojjari_user',
      DB_PASSWORD:            'StrongPassword@2024!',
      DB_NAME:                'pojjari_db',
      GROQ_API_KEY:           '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',
    }
  }]
};
