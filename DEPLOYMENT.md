# 🚀 Deployment Guide

## Vercel Cloud (Empfohlen)

### Einmaliges Setup

1. **GitHub Repository forken**
   ```bash
   git clone https://github.com/moriarty-source/storyteller.git
   ```

2. **Auf Vercel importieren**
   - https://vercel.com/new
   - GitHub Repository auswählen
   - "Deploy" klicken

3. **PostgreSQL Database hinzufügen**
   - Im Vercel Dashboard: Project → Storage → Add Database
   - "PostgreSQL" → "Neon" (kostenlos, 0.5 GB)
   - "Create" klicken
   - Vercel setzt `DATABASE_URL` automatisch

4. **Fertig!**
   - App ist live unter `https://your-app.vercel.app`
   - Datenbank wird beim ersten Request automatisch initialisiert

### Deployment aktualisieren

```bash
git add .
git commit -m "feat: your changes"
git push origin master
```

Vercel deployed automatisch bei jedem Push!

---

## Lokaler Server (Für Workshops ohne Internet)

### Installation

```bash
# Clone
git clone https://github.com/moriarty-source/storyteller.git
cd storyteller

# Install
npm install

# Build
npm run build

# Start
npm start
```

### Netzwerk-Zugriff

1. **IP-Adresse herausfinden**
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```

2. **Firewall konfigurieren**
   ```powershell
   # Windows PowerShell (Admin)
   New-NetFirewallRule -DisplayName "Storyteller" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```

3. **Auf iPads zugreifen**
   - Safari öffnen
   - `http://[IP-ADRESSE]:3000` eingeben
   - "Zum Home-Bildschirm hinzufügen" für Vollbild

### Daten persistieren

Die SQLite-Datenbank wird gespeichert unter:
```
./data/stories.db
```

**Backup erstellen:**
```bash
# Windows
Copy-Item data\stories.db data\stories-backup-$(Get-Date -Format 'yyyy-MM-dd').db

# Mac/Linux
cp data/stories.db data/stories-backup-$(date +%Y-%m-%d).db
```

---

## Environment Variables

| Variable | Wert | Beschreibung |
|----------|------|--------------|
| `DATABASE_URL` | (von Vercel) | PostgreSQL Connection String |

### Für lokalen Server (SQLite)

Keine Environment Variables nötig - SQLite wird automatisch verwendet.

---

## Testing

```bash
# Alle Tests
npm test

# Build testen
npm run build

# Production lokal testen
npm start
```

---

## Bekannte Einschränkungen

### Vercel Serverless
- ✅ PostgreSQL funktioniert einwandfrei
- ✅ Automatische Skalierung
- ✅ Kostenlose Tier ausreichend für Workshops
- ⏳ Cold Start beim ersten Request (~5-10s)

### Lokaler Server
- ✅ Keine Internet-Verbindung nötig
- ✅ Schnell im lokalen WLAN
- ⚠️ Manuelle Backups erforderlich
- ⚠️ Begrenzt auf lokale Netzwerk-Reichweite

---

## Support

**Probleme?**
1. README.md konsultieren
2. GitHub Issues: https://github.com/moriarty-source/storyteller/issues

**Workshop-Checkliste:**
- [ ] Server installiert und gestartet
- [ ] Firewall konfiguriert
- [ ] IP-Adresse notiert
- [ ] Test-Geschichte erstellt
- [ ] Mit eigenem iPad getestet
- [ ] Backup-Prozedur getestet

---

**Letztes Update:** 2026-05-31  
**Status:** ✅ Production Ready

### ✅ Abgeschlossene Arbeiten

#### 1. Code Fixes
- **Datei:** `src/lib/inkCompiler.ts`
- **Änderungen:**
  - `forReader` Option korrigiert: Intro-Text wird übersprungen (Cover UI zeigt Daten direkt)
  - Nur aktive Stationen (mit Text ODER Choices) werden zu Ink-Knoten kompiliert
  - Verhindert leere Stationen im Reader-Flow

#### 2. Tests
- **63 Tests bestanden** (100% Pass-Rate)
- Integrationstest für Datenbank-Persistenz durchgeführt
- Build erfolgreich (TypeScript + Next.js)

#### 3. Datenbank-Sicherheit
- SQLite mit WAL-Modus (Write-Ahead Logging)
- Persistenz verifiziert: Daten bleiben nach Server-Neustart erhalten
- Auto-Save im Editor (500ms Debounce)
- `data/` Verzeichnis wird automatisch erstellt

#### 4. Deployment
- GitHub Repository erstellt: `moriarty-source/storyteller`
- Auf Vercel deployed (Production)
- Alle Routen funktionsfähig

---

## 🏗️ Architektur-Übersicht

### Tech Stack
| Komponente | Technologie |
|------------|-------------|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Sprache | TypeScript |
| Styling | Tailwind CSS 4.3.0 |
| Datenbank | SQLite (better-sqlite3) |
| Story-Engine | inkjs 2.4.0 |
| PDF-Export | @react-pdf/renderer |
| Hosting | Vercel |

### Wichtige Routen
| Route | Typ | Zweck |
|-------|-----|-------|
| `/` | Static | Landing Page (Code-Eingabe / Neue Story) |
| `/story/[code]` | Dynamic | Story Editor (active) oder Redirect zu /read |
| `/story/[code]/read` | Dynamic | Interactive Reader (inkjs) |
| `/story/[code]/view` | Dynamic | Statische Übersicht + PDF (Admin) |
| `/admin` | Static | Admin Board (Passwort-geschützt) |
| `/api/stories/[code]/ink-json` | Dynamic | Server-side Ink-Kompilierung |

---

## 🔒 Datensicherheit

### Persistenz
- ✅ SQLite-Datei: `data/stories.db`
- ✅ WAL-Modus für Performance und Crash-Recovery
- ✅ Auto-Save alle 500ms (debounced)
- ✅ Sofortiges Speichern bei Stationswechsel
- ✅ `.gitignore` ignoriert `data/` Verzeichnis

### Auto-Save Implementation
```typescript
// StoryEditor.tsx:63-77
function scheduleAutoSave(...) {
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  saveTimeoutRef.current = setTimeout(() => {
    saveStory(...);
  }, 500);
}
```

### Visuelles Feedback
- "Speichert…" (während Save)
- "✓ Gespeichert" (nach Erfolg)
- "✗ Fehler" (bei Error)

---

## 📦 Git Commits

```
40312cb fix: inkCompiler forReader mode and skip empty stations
b3727dc feat: add /story/[code]/read page — interactive story reader
7b0f2d2 fix: show station 6 text, guard empty consequence, improve type safety
282f5f6 feat: add StoryReader component — cover, page-by-page Ink playthrough
1352dc5 fix: redirect completed stories to /read instead of /view
```

---

## 🧪 Test-Ergebnisse

```
Test Suites: 5 passed, 5 total
Tests:       63 passed, 63 total
Snapshots:   0 total
Time:        ~1s
```

### Integration Test (manuell durchgeführt)
```
✓ CREATE works
✓ READ works
✓ UPDATE works
✓ PERSISTENCE works (WAL mode)
✓ LIST works
```

---

## 🎯 Features (100% implementiert)

### Editor
- [x] Character Sheet (Station 0)
- [x] Station Editor (1-6) mit Wort-Limits
- [x] Choice Cards (2-3 Entscheidungen pro Station)
- [x] Inventar-System
- [x] Auto-Save (500ms Debounce)
- [x] Word Counter mit Fortschrittsanzeige
- [x] Stations-Fortschritt (Punkte)

### Reader
- [x] Cover-Seite mit Welt/Charakter-Info
- [x] Seitenweise Navigation (Buchseiten-Stil)
- [x] 6-Punkte-Fortschrittsleiste
- [x] Konsequenz-Anzeige nach jeder Wahl
- [x] Zusammenfassung am Ende
- [x] Ink-Engine (inkjs) für interaktiven Flow

### Admin
- [x] Geschichten-Übersicht (Tabelle)
- [x] "Abschließen"-Button pro Story
- [x] Konfigurierbare Wort-Limits
- [x] Passwort-Schutz

---

## 🐛 Bekannte Einschränkungen

1. **Dev-Server Netzwerk-Issue**
   - Hintergrund-Prozess manchmal nicht erreichbar
   - Environment-spezifisch (Firewall/Port-Konflikt)
   - **Lösung:** Production-Deploy auf Vercel funktioniert einwandfrei

2. **Kein Backup-System**
   - Bei Datenbank-Korruption manuelles Backup nötig
   - **Empfehlung:** Regelmäßige Exporte via Admin-Board

3. **Kein "Zurück"-Button im Reader**
   - Gewollt (YAGNI laut Spec)
   - Refresh = Neustart

---

## 📁 Wichtige Dateien

```
src/
├── app/
│   ├── api/
│   │   ├── stories/[code]/ink-json/route.ts  # Ink-Kompilierung
│   │   └── ...
│   └── story/[code]/
│       ├── read/page.tsx                     # Reader-Seite
│       └── page.tsx                          # Editor/Redirect
├── components/
│   ├── StoryReader.tsx                       # Reader-Komponente
│   ├── StoryEditor.tsx                       # Editor mit Auto-Save
│   └── ...
├── lib/
│   ├── inkCompiler.ts                        # Story → Ink
│   ├── stories.ts                            # CRUD
│   └── db.ts                                 # SQLite
└── types/
    └── story.ts                              # TypeScript-Typen
```

---

## 🔧 Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm test            # Run Jest tests
npm run lint        # ESLint

# Deployment
vercel deploy --prod  # Deploy to Vercel
```

---

## 📊 Nächste Schritte (Optional)

- [ ] Flowchart-Visualisierung der Verzweigungen
- [ ] Ink-Code-Ansicht für Lehrer
- [ ] Statistiken (wer hat was gelesen)
- [ ] Backup/Export-Funktion im Admin-Board
- [ ] Mehrsprachigkeit

---

**Erstellt:** 2026-05-31  
**Status:** ✅ Production Ready  
**Deployed:** https://storyteller-app-cyan.vercel.app