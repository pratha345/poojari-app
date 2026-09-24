# Pojjari backend deploy. Reads server details from deploy.ps1, backs up the current
# files on the server, uploads the new ones, checks they load, then restarts PM2.
# Usage (from the repo root):
#   .\deploy-backend.ps1                                   # janam patrika + kundali services
#   .\deploy-backend.ps1 -Files services/x.js,controllers/y.js   # paths under backend/src
param([string[]]$Files = @("services/janamPatrikaService.js", "services/kundaliService.js"))

$c       = Get-Content "$PSScriptRoot\deploy.ps1" -Raw
$SERVER  = [regex]::Match($c, '\$SERVER\s*=\s*"([^"]+)"').Groups[1].Value
$HOSTKEY = [regex]::Match($c, '\$HOSTKEY\s*=\s*"([^"]+)"').Groups[1].Value
$PW      = [regex]::Match($c, '\$PW\s*=\s*"([^"]+)"').Groups[1].Value
$PLINK   = "C:\Program Files\PuTTY\plink.exe"
$PSCP    = "C:\Program Files\PuTTY\pscp.exe"
$REMOTE  = "/var/www/pojjari/backend/src"
$FILES   = $Files
$STAMP   = Get-Date -Format "yyyyMMdd-HHmm"

Write-Host "[1/4] Backing up current files on server..." -ForegroundColor Yellow
# New files have nothing to back up; they are removed again on rollback
$bk = ($FILES | ForEach-Object { "{ [ ! -f $_ ] || cp $_ $_.bak-$STAMP; }" }) -join " && "
& $PLINK -pw $PW -batch -hostkey $HOSTKEY $SERVER "cd $REMOTE && $bk && echo backup-ok"
if ($LASTEXITCODE -ne 0) { Write-Host "Backup failed, stopping." -ForegroundColor Red; exit 1 }

Write-Host "[2/4] Uploading..." -ForegroundColor Yellow
foreach ($f in $FILES) {
    $local = Join-Path "$PSScriptRoot\backend\src" ($f -replace '/', '\')
    & $PSCP -q -pw $PW -hostkey $HOSTKEY $local "${SERVER}:${REMOTE}/$f"
    if ($LASTEXITCODE -ne 0) { Write-Host "Upload of $f failed, stopping." -ForegroundColor Red; exit 1 }
}

Write-Host "[3/4] Checking the uploaded modules load on the server..." -ForegroundColor Yellow
# Checks run from files: Windows PowerShell 5.1 strips inner double quotes from
# native-command arguments, which breaks an inline node -e script.
& $PSCP -q -pw $PW -hostkey $HOSTKEY "$PSScriptRoot\scripts\deploy_require_check.js" "${SERVER}:/tmp/deploy_require_check.js"
$mods = ($FILES | ForEach-Object { "src/$_" }) -join " "
$cmd = "cd /var/www/pojjari/backend && node /tmp/deploy_require_check.js $mods"
if ($FILES -contains "services/janamPatrikaService.js") {
    & $PSCP -q -pw $PW -hostkey $HOSTKEY "$PSScriptRoot\scripts\jp_deploy_check.js" "${SERVER}:/tmp/jp_deploy_check.js"
    $cmd += " && node /tmp/jp_deploy_check.js"   # expect: Simha, Magha 1, Dhanu 4deg11
}
& $PLINK -pw $PW -batch -hostkey $HOSTKEY $SERVER $cmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "Check failed, restoring backup." -ForegroundColor Red
    $rs = ($FILES | ForEach-Object { "{ if [ -f $_.bak-$STAMP ]; then cp $_.bak-$STAMP $_; else rm -f $_; fi; }" }) -join " && "
    & $PLINK -pw $PW -batch -hostkey $HOSTKEY $SERVER "cd $REMOTE && $rs"
    exit 1
}

Write-Host "[4/4] Restarting pojjari-backend..." -ForegroundColor Yellow
& $PLINK -pw $PW -batch -hostkey $HOSTKEY $SERVER "pm2 restart pojjari-backend --update-env > /dev/null && sleep 3 && pm2 describe pojjari-backend | grep -E 'status|restarts'"
Write-Host "Done." -ForegroundColor Green
