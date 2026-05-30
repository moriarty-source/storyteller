# Story Maker - Deploy to Raspberry Pi
# Usage: ./deploy.ps1 [Pi-IP] [SSH-Key-Path]
# Example: ./deploy.ps1 192.168.178.70 C:\Users\Offic\.ssh\raspi_key

param(
    [string]$PiIp = "192.168.178.70",
    [string]$SshKey = "C:\Users\Offic\.ssh\raspi_key"
)

$ErrorActionPreference = "Stop"

Write-Host ">>> Story Maker Deployment" -ForegroundColor Cyan

# 1. Create bundle
Write-Host "`n[1/3] Creating bundle..." -ForegroundColor Yellow
git bundle create storyteller.bundle --all
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Bundle creation failed" -ForegroundColor Red
    exit 1
}

# 2. Upload to Pi
Write-Host "[2/3] Uploading to Pi..." -ForegroundColor Yellow
scp -i $SshKey storyteller.bundle "pi@${PiIp}:/home/pi/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Upload failed" -ForegroundColor Red
    exit 1
}

# 3. Build on Pi
Write-Host "[3/3] Building on Pi..." -ForegroundColor Yellow
ssh -i $SshKey "pi@${PiIp}" @"
    set -e
    rm -rf ~/storyteller
    git clone ~/storyteller.bundle ~/storyteller
    cd ~/storyteller
    npm install --omit=dev
    npm run build
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n[OK] Deployment successful!" -ForegroundColor Green
Write-Host "App running at http://${PiIp}:3000" -ForegroundColor Cyan
Write-Host "`nTo start the app on Pi, run:" -ForegroundColor Yellow
Write-Host "ssh -i $SshKey pi@$PiIp" -ForegroundColor White
Write-Host "cd ~/storyteller && npm start" -ForegroundColor White
