# Storyteller - Interaktives Storytelling Tool

Ein browserbasiertes Tool für Schreibworkshops (Klassen 6-7), mit dem Schüler interaktive Geschichten erstellen können.

## 🚀 Deployments

| Plattform | URL | Best für |
|-----------|-----|----------|
| **Vercel (Cloud)** | https://storyteller-app-cyan.vercel.app | Online Workshops, Multi-Geräte |
| **Raspberry Pi (Lokal)** | http://192.168.178.70:3000 | Schulnetzwerk, Offline, Datenschutz |

---

## 📱 Schnelleinstieg

### Variante 1: Cloud (Vercel)
Einfach auf https://storyteller-app-cyan.vercel.app zugreifen — keine Installation nötig!

### Variante 2: Lokal (Raspberry Pi / Windows / Mac)

```bash
# 1. Repository klonen
git clone https://github.com/moriarty-source/storyteller.git
cd storyteller

# 2. Installation
npm install

# 3. Build
npm run build

# 4. Server starten
npm start

# 5. Lokale IP-Adresse herausfinden
ipconfig  # Windows (nach IPv4 suchen)
ifconfig  # Mac/Linux

# 6. Auf Schüler-Geräten öffnen
# http://[DEINE-IP]:3000
# Beispiel: http://192.168.178.70:3000
```

**Für Vercel-Deployment deiner eigenen Instanz:**
1. Repository forken zu deinem GitHub
2. Auf Vercel importieren (https://vercel.com/new)
3. Deploy-Button klicken — fertig!
   (Keine externe Datenbank nötig, SQLite wird lokal/automatisch konfiguriert)

---

## 📋 Features

### Für Schüler
- ✅ Character Sheet (Name, Stärke, Schwäche, Ziel, Geheimnis)
- ✅ Inventar-System
- ✅ 6 Stationen der Heldenreise
- ✅ 2-3 Entscheidungen pro Station (Diamond-Pattern)
- ✅ Auto-Save (500ms Debounce)
- ✅ Word Counter mit Fortschrittsanzeige
- ✅ Interaktiver Reader zum Durchspielen
- ✅ PDF-Export für fertige Geschichten

### Für Lehrkräfte
- ✅ Admin-Board mit Übersicht aller Geschichten
- ✅ Geschichten als "abgeschlossen" markieren
- ✅ Wort-Limits konfigurierbar
- ✅ Passwort-geschützter Bereich

---

## 🏗️ Tech Stack

| Komponente | Technologie |
|------------|-------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Sprache | TypeScript |
| Styling | Tailwind CSS 4 |
| Datenbank | SQLite (via better-sqlite3) |
| Story-Engine | inkjs 2.4 |
| PDF-Export | @react-pdf/renderer |
| Hosting | Vercel + Raspberry Pi |

---

## 📁 Projektstruktur

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── stories/       # Story CRUD
│   │   └── admin/         # Admin endpoints
│   ├── story/[code]/      # Story pages
│   │   ├── read/          # Interactive reader
│   │   └── view/          # Static view + PDF
│   └── admin/             # Admin board
├── components/            # React Components
│   ├── StoryEditor.tsx    # Main editor
│   ├── StoryReader.tsx    # Interactive reader
│   ├── CharacterSheet.tsx # Station 0
│   ├── StationEditor.tsx  # Stations 1-6
│   └── ...
├── lib/                   # Utilities
│   ├── db.ts             # SQLite connection
│   ├── stories.ts        # Story CRUD (synchronous)
│   ├── config.ts         # Config management (synchronous)
│   └── inkCompiler.ts    # Story → Ink compiler
└── types/                # TypeScript types
    └── story.ts
```

---

## 🔧 Development

```bash
# Installation
npm install

# Development Server
npm run dev

# Production Build
npm run build
npm start

# Tests
npm test

# Lint
npm run lint
```

### Environment Variables

**Optional (standardmäßig nicht nötig):**
- `DB_PATH` - SQLite Dateipfad (Standard: `data/stories.db`)

Die Anwendung funktioniert **sofort ohne weitere Konfiguration** — SQLite wird lokal initialisiert.

---

## 📊 Datenbank-Schema (SQLite)

### stories table
```sql
CREATE TABLE stories (
  code TEXT PRIMARY KEY,
  status TEXT DEFAULT 'active',  -- 'active' or 'completed'
  character TEXT DEFAULT '{}',    -- JSON string
  world TEXT DEFAULT '{}',        -- JSON string
  inventory TEXT DEFAULT '[]',    -- JSON string
  stations TEXT DEFAULT '[]',     -- JSON string
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### config table
```sql
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL              -- JSON string
)
```

**Standard-Konfiguration:**
- `wordLimits`: Word-Limits pro Station (station1-6, consequence)
- `adminPassword`: Admin-Passwort für Story-Verwaltung

---

## 🎯 Workshop-Ablauf (3 Stunden)

### Phase 1: Welt & Figur (30 Min)
- Character Sheet ausfüllen
- Welt-Beschreibung + Problem
- Inventar einführen

### Phase 2: Heldenreise (90 Min)
- 6 Stationen durcharbeiten
- Pro Station: Text + 2-3 Entscheidungen
- Wort-Limits beachten

### Phase 3: Abschluss (60 Min)
- Geschichten "abschließen" (Admin)
- Reader testen
- PDF-Export zeigen
- Gemeinsames Lesen

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
PORT=3001 npm start
```

### iPads/Schüler-Geräte können nicht verbinden
- Firewall: Port 3000 freigeben
- Gleiches WLAN-Netzwerk: Router-Einstellungen prüfen
- Test vom Workshop-Rechner: `curl http://localhost:3000`
- Test von anderem Gerät: `curl http://[SERVER-IP]:3000`

### Stories verlieren beim Neustart (Pi)
- **Gelöst durch systemd Service** (siehe DEPLOYMENT.md)
- Manueller Start: `npm start` speichert in `data/stories.db`
- Sicherung: Kopiere `data/stories.db` vor Neuinstallation

### Ink-Compiler-Fehler
- Story-Status muss `"completed"` sein, bevor Reader laden kann
- Überprüfe: Admin-Panel → Story als "abgeschlossen" markieren

---

## 📞 Support

- **GitHub Issues:** https://github.com/moriarty-source/storyteller/issues
- **Dokumentation:** DEPLOYMENT.md für detaillierte Setup-Anleitung

---

## 📝 License

MIT License - frei für Bildungszwecke nutzbar

**Erstellt:** 2026-05-31  
**Letztes Update:** 2026-05-31 (Dual Deployment: Vercel + Raspberry Pi)  
**Status:** ✅ Production Ready