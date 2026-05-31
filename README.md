# Story Maker — Storytelling Workshop Tool

Interaktives Webtool für den Storytelling-Workshop im Kulturkino. Schüler der 6. und 7. Klasse schreiben angeleitete interaktive Geschichten basierend auf der Heldenreise.

## Entwicklung (lokal)

```bash
npm install
npm run dev
```

Dann http://localhost:3000 öffnen.

## Produktion (Raspberry Pi)

### Deployment (von Windows/Mac)

Aus dem Storyteller-Ordner:

```powershell
# Passwort-Login auf Pi aktivieren (einmalig):
ssh pi@192.168.178.70
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart ssh
exit

# Dann deployen (mit deploy.ps1 auf Windows):
./deploy.ps1 192.168.178.70
```

Das Skript:
- Erstellt ein Bundle mit allen Code-Änderungen
- Lädt es auf den Pi hoch
- Baut die App neu
- Installiert einen systemd service für Autostart
- Startet die App

### Manuelle Installation auf dem Pi

Falls du lieber manuell deployest:

```bash
cd ~
git clone [repo-url] storyteller
cd storyteller
npm install --omit=dev
npm run build

# Service installieren (für Autostart)
sudo cp storyteller.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable storyteller
sudo systemctl start storyteller
```

### Erreichbarkeit

Der Server läuft auf Port 3000. Im Workshop-WLAN ist die App erreichbar unter:
http://[PI-IP-ADRESSE]:3000

Die IP-Adresse des Pi findest du mit: `hostname -I`

### App-Management

```bash
# Status ansehen
sudo systemctl status storyteller

# Logs live anschauen
sudo journalctl -u storyteller -f

# Neustart
sudo systemctl restart storyteller

# Stoppen
sudo systemctl stop storyteller
```

## Workshop-Anleitung (für Lehrkräfte)

1. Pi starten und sicherstellen, dass er im Workshop-WLAN ist
2. App läuft automatisch (systemd service)
   - Falls nötig manuell starten: `sudo systemctl start storyteller`
   - Status prüfen: `sudo systemctl status storyteller`
3. Schüler öffnen http://[PI-IP]:3000 auf den iPads
4. Admin-Board: http://[PI-IP]:3000/admin (Standard-Passwort: admin)

### Admin-Board Features
- Alle Geschichten im Überblick mit Fortschritt
- Geschichte "Abschließen" → Schüler sehen schön formatierte Version + PDF-Export
- Wort-Limits live anpassen (ohne Neustart)

### Admin-Passwort ändern

Das Standard-Passwort ist "admin". Es kann über die Datenbank geändert werden:

```bash
sqlite3 data/stories.db "UPDATE config SET value='NEUES_PASSWORT' WHERE key='adminPassword';"
```

## Technologie

- Next.js 15 (App Router)
- SQLite (better-sqlite3)
- inkjs (Ink story engine)
- @react-pdf/renderer (PDF-Export)
- Tailwind CSS v4
