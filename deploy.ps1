# Story Maker — Deploy to Raspberry Pi
# Nutzen: ./deploy.ps1 [Pi-IP] [SSH-Schlüssel-Pfad]
# Beispiel: ./deploy.ps1 192.168.178.70 C:\Users\Offic\.ssh\raspi_key

param(
    [string]$PiIp = "192.168.178.70",
    [string]$SshKey = "C:\Users\Offic\.ssh\raspi_key"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Story Maker Deployment" -ForegroundColor Cyan

# 1. Bundle erstellen
Write-Host "`n📦 Erstelle Bundle..." -ForegroundColor Yellow
git bundle create storyteller.bundle --all
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Bundle-Erstellung fehlgeschlagen" -ForegroundColor Red
    exit 1
}

# 2. Auf Pi hochladen
Write-Host "`n📤 Lade auf Pi hoch..." -ForegroundColor Yellow
scp -i $SshKey storyteller.bundle "pi@${PiIp}:/home/pi/" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload fehlgeschlagen" -ForegroundColor Red
    exit 1
}

# 3. Auf Pi bauen und starten
Write-Host "`n🔨 Baue auf Pi..." -ForegroundColor Yellow
ssh -i $SshKey "pi@${PiIp}" @"
    set -e
    rm -rf ~/storyteller
    git clone ~/storyteller.bundle ~/storyteller
    cd ~/storyteller
    npm install --omit=dev
    npm run build
    echo '✅ Build abgeschlossen'
    echo '🎬 Starte App...'
    npm start
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build/Start fehlgeschlagen" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Deployment erfolgreich!" -ForegroundColor Green
Write-Host "🌐 App läuft unter http://${PiIp}:3000" -ForegroundColor Cyan
