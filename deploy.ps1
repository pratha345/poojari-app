# Pojjari Deploy Script
# Run after every npm run build to sync missing assets to production server.
# Usage: .\deploy.ps1

$SERVER  = "root@64.227.152.85"
$HOSTKEY = "ssh-ed25519 255 SHA256:xjdoaCAoBdoZKvbCobRaamhYqZImpwzACAJqsE7Y3EU"
$PW      = "NckUX?&wxHHa@123"
$PLINK   = "C:\Program Files\PuTTY\plink.exe"
$PSCP    = "C:\Program Files\PuTTY\pscp.exe"
$LOCAL   = "f:\pojjari_v2_with_images\pojjari_updated\frontend\dist"
$REMOTE  = "/var/www/pojjari/frontend/dist"

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Pojjari Deploy - Missing File Sync  " -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Local files
$localFiles = Get-ChildItem "$LOCAL\assets" | Select-Object -ExpandProperty Name | Sort-Object
Write-Host "[1/4] Local dist: $($localFiles.Count) files" -ForegroundColor Yellow

# Step 2: Server files
Write-Host "[2/4] Fetching server file list..." -ForegroundColor Yellow
$serverOutput = & $PLINK -pw $PW -batch -hostkey $HOSTKEY $SERVER "ls $REMOTE/assets/"
$serverFiles  = $serverOutput -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" } | Sort-Object
Write-Host "      Server dist: $($serverFiles.Count) files" -ForegroundColor Yellow

# Step 3: Find missing
$missing = $localFiles | Where-Object { $serverFiles -notcontains $_ }
Write-Host ""

if ($missing.Count -eq 0) {
    Write-Host "[3/4] OK - All files present on server, nothing missing!" -ForegroundColor Green
} else {
    Write-Host "[3/4] Missing files ($($missing.Count)):" -ForegroundColor Red
    foreach ($f in $missing) {
        Write-Host "      MISSING: $f" -ForegroundColor Red
    }
    Write-Host ""

    # Step 4: Upload missing
    Write-Host "[4/4] Uploading missing files..." -ForegroundColor Yellow
    $ok = 0
    $fail = 0
    foreach ($f in $missing) {
        $src = "$LOCAL\assets\$f"
        Write-Host "      >> $f ..." -NoNewline
        & $PSCP -pw $PW -hostkey $HOSTKEY $src "${SERVER}:${REMOTE}/assets/" 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " DONE" -ForegroundColor Green
            $ok++
        } else {
            Write-Host " FAILED" -ForegroundColor Red
            $fail++
        }
    }
    Write-Host ""
    if ($fail -eq 0) {
        Write-Host "      Upload complete: $ok OK" -ForegroundColor Green
    } else {
        Write-Host "      Upload: $ok OK, $fail FAILED" -ForegroundColor Red
    }
}

# Step 5: index.html always upload
Write-Host ""
Write-Host "[+] Uploading index.html..." -ForegroundColor Yellow
& $PSCP -pw $PW -hostkey $HOSTKEY "$LOCAL\index.html" "${SERVER}:${REMOTE}/" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "    index.html DONE" -ForegroundColor Green
} else {
    Write-Host "    index.html FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Deploy Complete!" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
