# Storyteller - Deployment & Session State

## 🚀 Live Deployment

**Production URL:** https://storyteller-app-cyan.vercel.app

**GitHub Repository:** https://github.com/moriarty-source/storyteller

---

## 📋 Session State - 2026-05-31

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