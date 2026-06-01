# Storyteller

Browserbasiertes Tool für Schreibworkshops (Klassen 6–7). Schüler erstellen interaktive Geschichten nach dem Heldenprinzip — der fertige Text wird mit der Ink-Engine spielbar.

## Live-Instanzen

| Plattform | URL | Einsatz |
|---|---|---|
| **Vercel (Cloud)** | https://storyteller-app-cyan.vercel.app | Online-Workshops, mehrere Klassen |
| **Raspberry Pi (Lokal)** | http://192.168.178.70:3000 | Schulnetzwerk, Offline, Datenschutz |

## Schnellstart

```bash
git clone https://github.com/moriarty-source/storyteller.git
cd storyteller
npm install
npm run build
npm start
# → http://localhost:3000
```

Keine Datenbank-Konfiguration nötig — SQLite wird automatisch angelegt.

## Features

**Für Schüler**
- Character Sheet (Name, Stärke, Schwäche, Ziel, Geheimnis)
- 6 Stationen der Heldenreise mit Wort-Limits
- 2–3 Entscheidungen pro Station (Diamond-Pattern mit Konsequenzen)
- Inventar-System
- Auto-Save (500 ms Debounce)
- Interaktiver Reader (Ink-Engine) nach Abschluss

**Für Lehrkräfte**
- Admin-Board mit Übersicht aller Geschichten
- Geschichten als „abgeschlossen" markieren → Reader freischalten
- Wort-Limits konfigurierbar
- Passwortgeschützter Bereich (Standard: `admin`)

## Tech Stack

| Komponente | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Sprache | TypeScript |
| Styling | Tailwind CSS 4 |
| Datenbank | SQLite (Pi) · Neon Postgres (Vercel) |
| Story-Engine | inkjs 2.4 |
| PDF-Export | @react-pdf/renderer |

## Projektstruktur

```
src/
├── app/
│   ├── api/
│   │   ├── stories/           # Story CRUD + Ink-Kompilierung
│   │   └── admin/             # Admin-Endpoints (Auth-geschützt)
│   ├── story/[code]/
│   │   ├── page.tsx           # Editor (active) → Redirect (completed)
│   │   ├── read/              # Interaktiver Reader (inkjs)
│   │   └── view/              # Statische Übersicht + PDF
│   └── admin/                 # Admin-Board
├── components/                # React-Komponenten
├── lib/
│   ├── db-adapter.ts          # Adapter-Factory (SQLite ↔ Postgres)
│   ├── adapters/
│   │   ├── sqlite.ts          # better-sqlite3 (Pi/lokal)
│   │   └── postgres.ts        # @neondatabase/serverless (Vercel)
│   ├── stories.ts             # Story CRUD (async)
│   ├── config.ts              # Konfiguration (async)
│   ├── inkCompiler.ts         # Story → Ink-Quelltext
│   └── adminAuth.ts           # Admin-Authentifizierung
└── types/story.ts             # TypeScript-Typen
```

## Entwicklung

```bash
npm run dev     # Dev-Server
npm run build   # Production Build
npm test        # Jest Tests (53 Tests)
npm run lint    # ESLint
```

## Weiterführend

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Vollständige Deployment-Anleitung (Pi + Vercel)
- **[docs/SESSION_STATE.md](./docs/SESSION_STATE.md)** — Aktueller Projektstatus
- **[docs/ROADMAP.md](./docs/ROADMAP.md)** — Offene TODOs und geplante Features
- **[.env.example](./.env.example)** — Env-Variablen Referenz
