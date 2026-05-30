# Story Maker — Storytelling Workshop Tool

Interaktives Webtool für den Storytelling-Workshop im Kulturkino. Schüler der 6. und 7. Klasse schreiben angeleitete interaktive Geschichten basierend auf der Heldenreise.

## Entwicklung (lokal)

```bash
npm install
npm run dev
```

Dann http://localhost:3000 öffnen.

## Produktion (Raspberry Pi)

### Voraussetzungen
- Node.js 20+
- npm

### Setup

```bash
git clone [repo-url] storyteller
cd storyteller
npm install
npm run build
```

### Starten

```bash
npm start
```

Der Server läuft auf Port 3000. Im Workshop-WLAN ist die App erreichbar unter:
http://[PI-IP-ADRESSE]:3000

Tipp: Die IP-Adresse des Pi findest du mit: `hostname -I`

### Autostart mit PM2 (optional)

```bash
npm install -g pm2
pm2 start npm --name "storyteller" -- start
pm2 startup
pm2 save
```

## Workshop-Anleitung (für Lehrkräfte)

1. Pi starten und sicherstellen, dass er im Workshop-WLAN ist
2. App starten: `npm start` (oder PM2 läuft automatisch)
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
