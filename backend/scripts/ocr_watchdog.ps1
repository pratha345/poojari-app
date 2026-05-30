# OCR Watchdog — auto restarts OCR if it dies
# Run: powershell -ExecutionPolicy Bypass -File ocr_watchdog.ps1

$env:PYTHONIOENCODING = "utf-8"
$script   = "f:\pojjari_v2_with_images\pojjari_updated\backend\scripts\ocr_dharmasindhu.py"
$logFile  = "f:\pojjari_v2_with_images\pojjari_updated\backend\scripts\ocr_log_new.txt"
$errFile  = "f:\pojjari_v2_with_images\pojjari_updated\backend\scripts\ocr_err_new.txt"
$dbEnv    = "f:\pojjari_v2_with_images\pojjari_updated\backend\env"

function Get-DBProgress {
    $py = @"
import sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
with open(r'$dbEnv') as f:
    for line in f:
        line=line.strip()
        if line and not line.startswith('#') and '=' in line:
            k,v=line.split('=',1); os.environ.setdefault(k.strip(),v.strip())
import mysql.connector
try:
    c=mysql.connector.connect(host=os.environ['DB_HOST'],port=int(os.environ.get('DB_PORT',3306)),
        user=os.environ['DB_USER'],password=os.environ['DB_PASSWORD'],
        database=os.environ['DB_NAME'],charset='utf8mb4',connect_timeout=8)
    cur=c.cursor(); cur.execute('SELECT COUNT(*) FROM dharmasindhu_content'); n=cur.fetchone()[0]
    cur.execute("SELECT status FROM dharmasindhu_ocr_progress WHERE id=1"); s=cur.fetchone()
    c.close(); print(str(n)+','+str(s[0] if s else 'idle'))
except Exception as e: print('0,error')
"@
    $result = ($py | python 2>$null)
    return $result
}

Write-Host "OCR Watchdog started. Ctrl+C to stop." -ForegroundColor Green
$proc = $null

while ($true) {
    # Check if process is alive
    $alive = $false
    if ($proc -ne $null) {
        $alive = (Get-Process -Id $proc.Id -ErrorAction SilentlyContinue) -ne $null
    }

    if (-not $alive) {
        # Get current progress from DB
        $progress = Get-DBProgress
        $done = [int]($progress.Split(',')[0])
        $status = $progress.Split(',')[1]

        if ($status -eq 'completed' -or $done -ge 841) {
            Write-Host "`nAll 841 pages done! OCR Complete." -ForegroundColor Green
            break
        }

        $nextPage = $done + 1
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Starting OCR from page $nextPage (${done}/841 done)" -ForegroundColor Cyan

        $proc = Start-Process python `
            -ArgumentList "$script $nextPage 841" `
            -WorkingDirectory (Split-Path $script) `
            -RedirectStandardOutput $logFile `
            -RedirectStandardError $errFile `
            -WindowStyle Hidden -PassThru
    } else {
        # Show live log last line
        $lastLine = Get-Content $logFile -Encoding UTF8 -ErrorAction SilentlyContinue | Select-Object -Last 1
        if ($lastLine) { Write-Host "`r$lastLine" -NoNewline }
    }

    Start-Sleep -Seconds 15
}
