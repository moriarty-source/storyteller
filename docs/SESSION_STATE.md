# Session State — Storyteller

Dieses Dokument beschreibt den aktuellen Projektstatus nach jeder größeren Arbeitsphase.  
**Letztes Update:** 2026-06-02

---

## Deployment-Status

| Plattform | URL | Status | Datenbank |
|---|---|---|---|
| **Vercel** | https://storyteller-app-cyan.vercel.app | ⚠️ Story-Erstellung fehlerhaft | Neon `neon-emerald-cave` verbunden, aber `POSTGRES_URL` Env-Var fehlt noch |
| **Raspberry Pi** | http://192.168.178.70:3000 | ✅ Läuft | SQLite `data/stories.db` |

### Nächster manueller Schritt (Vercel)

Im Vercel Dashboard → Storage → `neon-emerald-cave` → **Environment Variables** prüfen und sicherstellen dass `POSTGRES_URL` oder `STORAGE_URL` in Production gesetzt ist.

---

## Was vollständig funktioniert

### Editor (Schüler-Seite)
- ✅ Landing Page — Code eingeben oder neue Story starten
- ✅ Character Sheet (Station 0) — Name, Stärke, Schwäche, Ziel, Geheimnis
- ✅ Stationen 1–6 — Texteditor mit Wort-Limit-Anzeige
- ✅ Entscheidungskarten (ChoiceCard) — 2–3 Choices pro Station, Diamond-Pattern
- ✅ Inventar-System — Items inline hinzufügen
- ✅ Auto-Save (500 ms Debounce) mit visuellem Feedback
- ✅ Story-Code-Label im Header (`Dein persönlicher Story-Code`)
- ✅ Abgeschlossene Story → automatischer Redirect zum Reader

### Reader (nach Abschluss)
- ✅ Cover-Seite mit Welt + Charakter-Info
- ✅ Seitenweise Navigation (Buchseiten-Stil)
- ✅ 6-Punkte-Fortschrittsleiste im Header
- ✅ Ink-Engine (inkjs) — echte interaktive Verzweigungen
- ✅ Konsequenz-Anzeige nach jeder Entscheidung
- ✅ Zusammenfassung aller Entscheidungen am Ende
- ✅ Server-seitige Ink-Kompilierung (`/api/stories/[code]/ink-json`)

### Admin-Board (Lehrkraft)
- ✅ Übersicht aller Geschichten mit Status und Zeitstempeln
- ✅ Story als „abgeschlossen" markieren → Reader freischalten
- ✅ Story löschen
- ✅ Wort-Limits konfigurierbar (pro Station + Konsequenz)
- ✅ Passwortschutz (Standard: `admin`)

### Infrastruktur
- ✅ Dual-DB Adapter — SQLite (Pi) + Neon Postgres (Vercel), automatisch erkannt
- ✅ Raspberry Pi systemd-Service — Auto-Start, Auto-Restart
- ✅ deploy.ps1 — halbautomatisches Deployment-Script
- ✅ Admin‑Tabelle virtualisiert (react-window) für große Story‑Mengen
- ✅ Full‑Story‑Workflow E2E‑Test mit Playwright
- ✅ CI‑Pipeline (GitHub Actions) mit Lint, Tests und Build
- ✅ 53 Jest-Tests — alle bestanden
- ✅ TypeScript — keine Fehler
- ✅ GitHub: https://github.com/moriarty-source/storyteller

---

## Was noch fehlt / bekannte Probleme

- **Kritisch:**
  - ⚠️ Vercel: `POSTGRES_URL` / `STORAGE_URL` muss im Dashboard gesetzt sein.

- **Kurzfristige To‑Do’s:**
  - Automatisches Backup der SQLite‑Datenbank auf dem Pi (Cron‑Job / Script‑Erweiterung).
  - Verbesserung der npm‑Pfaderkennung im `deploy.ps1` (Fallback‑Logik, Tests).
  - Export‑Funktion für Stories im Admin‑Board (CSV / PDF).
  - Ergänzung von E2E‑Tests für den Reader‑Flow und PDF‑Export.

- **Langfristige Verbesserungen:**
  - Mehrere Admin‑Benutzer verwalten.
  - UI‑Optimierung für mobile Geräte (Responsive Design).
  - Kollaborations‑Features (gemeinsames Schreiben).

---

## Architektur-Übersicht

```
Browser
  │
  ├── / (Landing)                   Static
  ├── /story/[code]                 SSR → StoryEditor
  ├── /story/[code]/read            SSR → StoryReader (inkjs Client-Side)
  ├── /story/[code]/view            SSR → StoryView + PDF-Export
  └── /admin                        Static + Client-Side Admin-Board

API
  ├── POST   /api/stories            Story erstellen (Code-Generierung)
  ├── GET    /api/stories/[code]     Story laden
  ├── PUT    /api/stories/[code]     Story speichern (Auto-Save)
  ├── GET    /api/stories/[code]/ink-json  Ink kompilieren (server-side)
  ├── GET    /api/admin/stories      Alle Geschichten (Auth)
  ├── PATCH  /api/admin/stories/[code]    Als abgeschlossen markieren (Auth)
  ├── DELETE /api/admin/stories/[code]    Story löschen (Auth)
  └── GET/PATCH /api/admin/config   Wort-Limits (Auth)

Datenbank (auto-select)
  POSTGRES_URL/STORAGE_URL/DATABASE_URL gesetzt → Neon Postgres (Vercel)
  sonst                                          → SQLite (Pi, lokal)
```

### Story-Datenmodell

```typescript
Story {
  code: string        // 4-stellig, z.B. "A4BX"
  status: "active" | "completed"
  character: {
    name, strength, weakness, goal, secret?
  }
  world: {
    description, problem
  }
  inventory: string[]
  stations: Station[] // 6 Stationen
}

Station {
  id: 1..6
  text: string
  choices: Choice[]   // 2–3 pro Station
  completed: boolean
}

Choice {
  id: string
  label: string       // Entscheidungstext
  consequence: string // Konsequenz-Text
}
```

### Ink-Compiler-Flow

```
Story (TypeScript) 
  → inkCompiler.ts (forReader: true)
  → Ink-Quelltext (string)
  → inkjs Compiler
  → compiled JSON
  → new Story(json) im Browser (StoryReader.tsx)
```

---

## Letzte Commits

```
150f161  Add dual-DB adapter: SQLite on Pi, Postgres on Vercel
d59f070  Update documentation with dual deployment info (Vercel + Pi)
174d792  fix: replace @vercel/postgres with better-sqlite3 (SQLite)
d8841b5  feat: add story-code label in header across all student-facing screens
43879ec  refactor: optimize project structure and cleanup
7064f3f  feat: virtualize admin table, add e2e skeleton, backup script improvements
3a9cdb1  fix: restore ConfigPanel, StationEditor, ChoiceCard and update deploy script
ff1dbd5  docs: add Backup & Deployment section to README
ba1899b  test: add full story workflow e2e test and CI workflow
```

---

## Workshop-Ablauf (Referenz)

| Phase | Dauer | Aktivität |
|---|---|---|
| 1 | 30 Min | Welt & Figur — Character Sheet, Welt-Beschreibung, Inventar |
| 2 | 90 Min | Heldenreise — 6 Stationen, je Text + 2–3 Entscheidungen |
| 3 | 60 Min | Abschluss — Admin markiert Stories, Reader zeigen, gemeinsam spielen |
