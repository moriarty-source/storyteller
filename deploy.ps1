# Story Maker - Deploy to Raspberry Pi
# Usage: ./deploy.ps1 [Pi-IP] [SSH-Key-Path]
# Example: ./deploy.ps1 192.168.178.70 C:\Users\Offic\.ssh\raspi_key

param(
    [string]$PiIp = "192.168.178.70",
    [string]$SshKey = "C:\Users\Offic\.ssh\raspi_key"
)

$ErrorActionPreference = "Stop"

Write-Host ">>> Story Maker Deployment" -ForegroundColor Cyan

# 1. Create local backup
Write-Host "[1/5] Creating local backup..." -ForegroundColor Yellow
$date = Get-Date -Format 'yyyy-MM-dd-HHmm'
$backupDir = "backups"
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
try {
    scp -i $SshKey "pi@${PiIp}:/home/pi/storyteller/data/stories.db" "$backupDir/stories-${date}.db" 2>$null
    Write-Host "[INFO] Backup saved to $backupDir/stories-${date}.db" -ForegroundColor Cyan
} catch {
    Write-Host "[WARN] Backup failed (possibly first deploy or Pi offline)" -ForegroundColor Yellow
}

# 2. Create bundle
Write-Host "`n[2/5] Creating bundle..." -ForegroundColor Yellow
git bundle create storyteller.bundle --all
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Bundle creation failed" -ForegroundColor Red
    exit 1
}

# 3. Upload bundle to Pi
Write-Host "[3/5] Uploading to Pi..." -ForegroundColor Yellow
scp -i $SshKey storyteller.bundle "pi@${PiIp}:/home/pi/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Upload failed" -ForegroundColor Red
    exit 1
}

# 4. Build on Pi and detect npm path
Write-Host "[4/5] Building on Pi..." -ForegroundColor Yellow
$sshCmd = @'
export NVM_DIR=\"\$HOME/.nvm\"
[ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" || true
set -e
rm -rf ~/storyteller
git clone ~/storyteller.bundle ~/storyteller
cd ~/storyteller
# Find npm path without command substitution or chaining
npmPath='/home/pi/.nvm/versions/node/v22.22.3/bin/npm'
if [ -x "/usr/local/bin/npm" ]; then npmPath='/usr/local/bin/npm'; fi
if [ -x "/usr/bin/npm" ]; then npmPath='/usr/bin/npm'; fi
# Get directory part of path
npmDir=""
case "$npmPath" in
    */*) npmDir="${npmPath%/*}" ;;
esac
export PATH="${npmDir}:$PATH"
npm ci
npm run build
echo $npmPath
'@

$buildOutput = ssh -i $SshKey "pi@${PiIp}" "$sshCmd"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed" -ForegroundColor Red
    exit 1
}

# Extract npm path from last non-empty line of output
$npmPath = ($buildOutput -split "`n" | Where-Object { $_.Trim() -ne '' } | Select-Object -Last 1).Trim()
# Validate that it looks like a path
if (-not $npmPath -or -not ($npmPath -match '^/.*npm(\s*$)?')) {
    $npmPath = "/home/pi/.nvm/versions/node/v22.22.3/bin/npm"
    Write-Host "[WARN] Could not detect npm path, using default: $npmPath" -ForegroundColor Yellow
} else {
    # Strip any trailing whitespace/newlines
    $npmPath = $npmPath -replace '\s+$', ''
    Write-Host "[INFO] Detected npm path: $npmPath" -ForegroundColor Cyan
}

# Generate service file with correct npm path (use LastIndexOf to keep forward slashes)
$npmDir = $npmPath.Substring(0, $npmPath.LastIndexOf('/'))
$serviceContent = @"
[Unit]
Description=Story Maker - Storytelling Workshop Tool
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/storyteller
Environment="PATH=$($npmDir):/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=$npmPath start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=storyteller

[Install]
WantedBy=multi-user.target
"@

$serviceContent | Out-File -FilePath "storyteller_generated.service" -Encoding utf8

# 5. Upload service file and install
Write-Host "[5/5] Installing systemd service..." -ForegroundColor Yellow
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
