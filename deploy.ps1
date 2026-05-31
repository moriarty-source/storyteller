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
Write-Host "`n[1/4] Creating bundle..." -ForegroundColor Yellow
git bundle create storyteller.bundle --all
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Bundle creation failed" -ForegroundColor Red
    exit 1
}

# 2. Upload bundle to Pi
Write-Host "[2/4] Uploading to Pi..." -ForegroundColor Yellow
scp -i $SshKey storyteller.bundle "pi@${PiIp}:/home/pi/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Upload failed" -ForegroundColor Red
    exit 1
}

# 3. Build on Pi and generate service file with correct npm path
Write-Host "[3/4] Building on Pi..." -ForegroundColor Yellow
$buildOutput = ssh -i $SshKey "pi@${PiIp}" "bash -i -c 'set -e; rm -rf ~/storyteller; git clone ~/storyteller.bundle ~/storyteller; cd ~/storyteller; npm ci; npm run build; which npm'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed" -ForegroundColor Red
    exit 1
}

# Extract npm path from last line of output
$npmPath = ($buildOutput -split "`n" | Where-Object { $_ -match "^/.*npm$" } | Select-Object -Last 1).Trim()
if (-not $npmPath) {
    $npmPath = "/home/pi/.nvm/versions/node/v22.22.3/bin/npm"
    Write-Host "[WARN] Could not detect npm path, using default: $npmPath" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Detected npm path: $npmPath" -ForegroundColor Cyan
}

# Generate service file with correct npm path
$npmDir = [System.IO.Path]::GetDirectoryName($npmPath)
$serviceContent = @"
[Unit]
Description=Story Maker - Storytelling Workshop Tool
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/storyteller
Environment="PATH=$npmDir:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=$npmPath start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=storyteller

[Install]
WantedBy=multi-user.target
"@

$serviceContent | Out-File -FilePath "storyteller_generated.service" -Encoding utf8NoBOM

# 4. Upload service file and install
Write-Host "[4/4] Installing systemd service..." -ForegroundColor Yellow
scp -i $SshKey storyteller_generated.service "pi@${PiIp}:/home/pi/storyteller.service"
Remove-Item storyteller_generated.service

ssh -i $SshKey "pi@${PiIp}" "sudo mv ~/storyteller.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable storyteller && sudo systemctl restart storyteller && sleep 2 && sudo systemctl status storyteller --no-pager"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Service installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n[OK] Deployment successful!" -ForegroundColor Green
Write-Host "App running at http://${PiIp}:3000" -ForegroundColor Cyan
Write-Host "`nService commands on Pi:" -ForegroundColor Yellow
Write-Host "sudo systemctl status storyteller" -ForegroundColor White
Write-Host "sudo journalctl -u storyteller -f" -ForegroundColor White
