# Pojjari backend deploy for the janam patrika / kundali services.
# Reads server details from deploy.ps1, backs up the current files on the
# server, uploads the new ones, checks them, then restarts PM2.
# Usage (from the repo root):  .\deploy-backend.ps1

$c       = Get-Content "$PSScriptRoot\deploy.ps1" -Raw
$SERVER  = [regex]::Match($c, '\$SERVER\s*=\s*"([^"]+)"').Groups[1].Value
$HOSTKEY = [regex]::Match($c, '\$HOSTKEY\s*=\s*"([^"]+)"').Groups[1].Value
$PW      = [regex]::Match($c, '\$PW\s*=\s*"([^"]+)"').Groups[1].Value
$PLINK   = "C:\Program Files\PuTTY\plink.exe"
$PSCP    = "C:\Program Files\PuTTY\pscp.exe"
$REMOTE  = "/var/www/pojjari/backend/src/services"
$FILES   = @("janamPatrikaService.js", "kundaliService.js")
$STAMP   = Get-Date -Format "yyyyMMdd-HHmm"

Write-Host "[1/4] Backing up current files on server..." -ForegroundColor Yellow
$bk = ($FILES | ForEach-Object { "cp $_ $_.bak-$STAMP" }) -join " && "
& $PLINK -pw $PW -batch -hostkey $HOSTKEY $SERVER "cd $REMOTE && $bk && echo backup-ok"
if ($LASTEXITCODE -ne 0) { Write-Host "Backup failed, stopping." -ForegroundColor Red; exit 1 }

Write-Host "[2/4] Uploading..." -ForegroundColor Yellow
foreach ($f in $FILES) {
    & $PSCP -q -pw $PW -hostkey $HOSTKEY "$PSScriptRoot\backend\src\services\$f" "${SERVER}:${REMOTE}/"
    if ($LASTEXITCODE -ne 0) { Write-Host "Upload of $f failed, stopping." -ForegroundColor Red; exit 1 }
}

Write-Host "[3/4] Checking reference chart on server (expect: Simha, Magha 1, Dhanu 4deg11)..." -ForegroundColor Yellow
# The check runs from a file: Windows PowerShell 5.1 strips inner double quotes
# from native-command arguments, which breaks an inline node -e script.
& $PSCP -q -pw $PW -hostkey $HOSTKEY "$PSScriptRoot\scripts\jp_deploy_check.js" "${SERVER}:/tmp/jp_deploy_check.js"
& $PLINK -pw $PW -batch -hostkey $HOSTKEY $SERVER "cd /var/www/pojjari/backend && node /tmp/jp_deploy_check.js"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Check failed, restoring backup." -ForegroundColor Red
    $rs = ($FILES | ForEach-Object { "cp $_.bak-$STAMP $_" }) -join " && "
    & $PLINK -pw $PW -batch -hostkey $HOSTKEY $SERVER "cd $REMOTE && $rs"
    exit 1
}

Write-Host "[4/4] Restarting pojjari-backend..." -ForegroundColor Yellow
& $PLINK -pw $PW -batch -hostkey $HOSTKEY $SERVER "pm2 restart pojjari-backend --update-env > /dev/null && sleep 3 && pm2 describe pojjari-backend | grep -E 'status|restarts'"
Write-Host "Done." -ForegroundColor Green
