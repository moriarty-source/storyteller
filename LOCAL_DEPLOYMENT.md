# 🏠 Lokales Deployment für Workshop

## Zielsetzung

Storyteller soll auf einem **Raspberry Pi** oder **Laptop** im lokalen Netzwerk laufen, damit Schüler auf iPads ohne Internet zugreifen können.

---

## 📦 Voraussetzungen

### Hardware
- Raspberry Pi 4/5 ODER Laptop mit Windows/Mac/Linux
- WLAN-Router (für lokales Netzwerk)
- Stromversorgung

### Software
- Node.js 18+ installiert
- npm oder pnpm
- Git (optional)

---

## 🚀 Installation

### Schritt 1: Repository herunterladen

```bash
# Option A: Git Clone
git clone https://github.com/moriarty-source/storyteller.git
cd storyteller

# Option B: ZIP Download
# 1. https://github.com/moriarty-source/storyteller/archive/refs/heads/main.zip
# 2. ZIP entpacken
# 3. Terminal im Ordner öffnen
```

### Schritt 2: Abhängigkeiten installieren

```bash
npm install
```

**Dauer:** ca. 2-3 Minuten (beim ersten Mal)

### Schritt 3: Build erstellen

```bash
npm run build
```

**Dauer:** ca. 30-60 Sekunden

### Schritt 4: Server starten

```bash
npm start
```

**Erwartete Ausgabe:**
```
> storyteller@0.1.0 start
> next start

- Ready on http://localhost:3000
```

---

## 📡 Netzwerk-Zugriff

### IP-Adresse herausfinden

**Windows:**
```bash
ipconfig
```
Nach "IPv4-Adresse" suchen (z.B. `192.168.178.73`)

**Mac/Linux:**
```bash
ifconfig
```
Nach "inet" suchen (z.B. `192.168.1.100`)

**Raspberry Pi:**
```bash
hostname -I
```

### Auf iPads zugreifen

1. Safari auf iPad öffnen
2. URL eingeben: `http://[IP-ADRESSE]:3000`
   
   Beispiel: `http://192.168.178.73:3000`

3. "Zum Home-Bildschirm hinzufügen" für Vollbild-Modus

---

## 🔧 Firewall konfigurieren

### Windows Firewall

```powershell
# PowerShell als Administrator öffnen
New-NetFirewallRule -DisplayName "Storyteller" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Mac Firewall

1. System Preferences → Security & Privacy → Firewall
2. Firewall Options…
3. Node.js als erlaubt hinzufügen

### Raspberry Pi (UFW)

```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

---

## 💾 Datenbank-Persistenz

Die SQLite-Datenbank wird gespeichert unter:

```
./data/stories.db
```

**Wichtig:**
- ✅ `data/` Verzeichnis wird automatisch erstellt
- ✅ Daten bleiben nach Server-Neustart erhalten
- ✅ Backup: Einfach `data/stories.db` kopieren

### Backup erstellen

```bash
# Windows PowerShell
Copy-Item data\stories.db data\stories-backup-$(Get-Date -Format 'yyyy-MM-dd').db

# Mac/Linux
cp data/stories.db data/stories-backup-$(date +%Y-%m-%d).db
```

---

## 🔄 Server automatisieren

### Windows (als Service)

1. **WinSW** installieren: https://github.com/winsw/winsw
2. XML-Config erstellen:
```xml
<service>
  <id>storyteller</id>
  <name>Storyteller Server</name>
  <description>Storyteller Workshop Server</description>
  <executable>npm</executable>
  <arguments>start</arguments>
  <workingdirectory>D:\Storyteller</workingdirectory>
  <logmode>reset</logmode>
</service>
```
3. Als Service installieren: `winsw install`

### Mac/Linux (systemd)

1. Service-Datei erstellen: `/etc/systemd/system/storyteller.service`

```ini
[Unit]
Description=Storyteller Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/storyteller
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

2. Enable und Start:
```bash
sudo systemctl enable storyteller
sudo systemctl start storyteller
sudo systemctl status storyteller
```

---

## 🐛 Troubleshooting

### "Port 3000 already in use"

**Problem:** Ein anderer Dienst benutzt Port 3000

**Lösung:** Anderen Port verwenden
```bash
PORT=3001 npm start
```
Dann auf `http://[IP]:3001` zugreifen

### "Cannot find module 'better-sqlite3'"

**Problem:** Native Module nicht kompiliert

**Lösung:**
```bash
npm rebuild better-sqlite3
npm run build
```

### "EACCES permission denied"

**Problem:** Keine Schreibrechte für data/ Verzeichnis

**Lösung:**
```bash
# Linux/Raspberry Pi
chmod 755 data
chown $USER:$USER data
```

### Server startet nicht nach Abbruch

**Problem:** Node-Prozess läuft noch im Hintergrund

**Lösung:**
```bash
# Windows
taskkill /F /IM node.exe

# Mac/Linux
pkill -f node
```

### iPads können nicht verbinden

**Checkliste:**
1. ✅ Server läuft (`npm start`)
2. ✅ IP-Adresse korrekt
3. ✅ Firewall erlaubt Port 3000
4. ✅ iPads im selben WLAN-Netzwerk
5. ✅ Keine Client-Isolation im Router

**Test vom Server-PC:**
```bash
curl http://localhost:3000
```
Sollte HTML zurückgeben.

---

## 📊 Performance

### Raspberry Pi 4
- Startzeit: ~15 Sekunden
- Response: <100ms im lokalen Netzwerk
- Gleichzeitige Nutzer: 10-15 problemlos

### Laptop (modern)
- Startzeit: ~5 Sekunden
- Response: <50ms
- Gleichzeitige Nutzer: 20+ möglich

---

## 🎯 Workshop-Setup Checkliste

### Am Vortag testen:
- [ ] Server installiert und gestartet
- [ ] IP-Adresse notiert
- [ ] Firewall konfiguriert
- [ ] Test-Geschichte erstellt
- [ ] Mit eigenem iPad getestet
- [ ] Backup-Prozedur getestet

### Vor Workshop-Start:
- [ ] Server hochfahren (5 Min vorher)
- [ ] WLAN testen
- [ ] IP-Adresse an Tafel schreiben
- [ ] Test-Geschichte für Demo bereit

### Während Workshop:
- [ ] Server läuft im Hintergrund
- [ ] Alle 30 Min: Kurzer Check ob alles läuft
- [ ] Bei Problemen: Neustart mit `Ctrl+C` → `npm start`

### Nach Workshop:
- [ ] Backup der Datenbank erstellen
- [ ] Server herunterfahren (`Ctrl+C`)
- [ ] Für nächsten Workshop bereit halten

---

## 📞 Support

Bei Problemen:
1. README.md konsultieren
2. DEPLOYMENT.md prüfen
3. GitHub Issues: https://github.com/moriarty-source/storyteller/issues

---

**Letztes Update:** 2026-05-31  
**Getestet auf:** Windows 11, macOS Sonoma, Raspberry Pi OS