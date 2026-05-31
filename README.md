# Storyteller - Interaktives Storytelling Tool

Ein browserbasiertes Tool für Schreibworkshops (Klassen 6-7), mit dem Schüler interaktive Geschichten erstellen können.

**Live:** https://storyteller-app-cyan.vercel.app

---

## 🚀 Quick Start

### Für Workshop-Leiter (Raspberry Pi / Lokaler Server)

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

# 5. IP-Adresse herausfinden
ipconfig  # Windows (nach IPv4 suchen)
ifconfig  # Mac/Linux

# 6. Auf iPads: http://[IP-ADRESSE]:3000
```

### Vercel Cloud Deployment

Die Anwendung ist bereits auf Vercel deployed. Für eigene Instanz:

1. Repository forken
2. Auf Vercel importieren
3. PostgreSQL Database hinzufügen (Storage → Add Database → PostgreSQL → Neon)
4. Fertig!

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
| Datenbank | Vercel PostgreSQL (via @vercel/postgres) |
| Story-Engine | inkjs 2.4 |
| PDF-Export | @react-pdf/renderer |
| Hosting | Vercel |

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
│   ├── db.ts             # PostgreSQL connection
│   ├── stories.ts        # Story CRUD
│   ├── config.ts         # Config management
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

### Environment Variables (für Vercel)

Wird automatisch von Vercel gesetzt bei PostgreSQL-Integration:
- `DATABASE_URL` - PostgreSQL connection string

---

## 📊 Datenbank-Schema

### stories table
```sql
CREATE TABLE stories (
  code TEXT PRIMARY KEY,
  status TEXT DEFAULT 'active',  -- 'active' or 'completed'
  character JSONB DEFAULT '{}',
  world JSONB DEFAULT '{}',
  inventory JSONB DEFAULT '[]',
  stations JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### config table
```sql
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
)
```

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

### "Database unavailable"
- Vercel: PostgreSQL im Dashboard hinzufügen
- Lokal: DATABASE_URL in .env.local setzen

### "Port 3000 already in use"
```bash
PORT=3001 npm start
```

### iPads können nicht verbinden
- Firewall: Port 3000 freigeben
- Gleiches WLAN-Netzwerk prüfen
- Test: `curl http://localhost:3000`

---

## 📞 Support

- **GitHub Issues:** https://github.com/moriarty-source/storyteller/issues
- **Dokumentation:** DEPLOYMENT.md für detaillierte Setup-Anleitung

---

## 📝 License

MIT License - frei für Bildungszwecke nutzbar

**Erstellt:** 2026-05-31  
**Letztes Update:** 2026-05-31  
**Status:** ✅ Production Ready