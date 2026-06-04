# ROADMAP — Storyteller

Offene Punkte, sortiert nach Priorität. Jeder Eintrag enthält Kontext und konkreten nächsten Schritt.

---

## 🔴 Wird als nächstes implementiert

### Storyteller Saga

Geführter Storytelling-Modus mit vorformulierten Textbausteinen, Mikro-Entscheidungen, Variablen-Substitution und variablem Schwierigkeitsgrad — koexistiert mit dem bestehenden Freitext-Modus.

**Plan:** `docs/superpowers/plans/2026-06-03-storyteller-saga.md`  
**Spec:** `docs/superpowers/specs/2026-06-03-storyteller-saga-design.md`  
**Aufwand:** ~3 Stunden (6 Phasen, ≤20 Dateien pro Phase)  
**Status:** Plan steht — kann direkt gestartet werden  
**Branching:** Pro Phase ein Feature-Branch (z.B. `feat/saga-phase-0-foundation`)

---

## 🟡 Mittel (sinnvoll, kein Blocker)

### Story-Export im Admin-Board

Lehrkräfte können Geschichten nur ansehen, nicht exportieren. Bei Abschluss eines Workshops gibt es keinen einfachen Weg, alle Texte zu sichern.

**Lösung A (einfach):** „Alle als ZIP exportieren" — JSON-Dateien aller Stories.  
**Lösung B (komplex):** PDF-Export pro Story direkt aus Admin-Board (nutzt bestehenden StoryDocument-Renderer).  
**Aufwand:** A = 2 Stunden, B = 4 Stunden

### Ink-Validierung beim Speichern

Fehler im Ink-Compiler werden erst sichtbar wenn Lehrkraft die Story „abschließt" — zu spät.

**Lösung:** Beim Speichern jeder Station server-seitig `compileToInk()` aufrufen und Warnungen im Editor anzeigen (kein Hard-Block, nur Hinweis).  
**Aufwand:** 3 Stunden

### Admin-Passwort im UI änderbar

Das Passwort-Feld existiert im Backend (`setAdminPassword` via `PUT /api/admin/password`), fehlt aber im ConfigPanel-UI.

**Lösung:** Passwort-Feld im ConfigPanel ergänzen.  
**Aufwand:** 2 Stunden

---

## 🟢 Nice-to-have (langfristig)

### Flowchart-Visualisierung

Entscheidungsbaum der Geschichte grafisch darstellen — hilft Schülern bei der Planung.  
**Bibliothek:** `reactflow` oder `d3` | **Aufwand:** 1–2 Tage

### Statistiken im Admin-Board

Welche Entscheidungen treffen Leser am häufigsten? Erfordert Tracking beim Durchspielen des Readers.  
**Aufwand:** 1 Tag

### Zurück-im-Reader-Navigation

„Letzte Entscheidung rückgängig" — mehrfach gewünscht, absichtlich nicht gebaut (YAGNI).  
**Aufwand:** 1 Tag (Ink-Story-State snapshotten)

### Mehrsprachigkeit

Interface auf Deutsch (aktuell) + optional Englisch.  
**Framework:** `next-intl` | **Aufwand:** 3–5 Tage

### E2E-Tests erweitern

Aktuell deckt der E2E-Test den vollständigen Autoren-Flow ab. Noch nicht getestet:
- Reader-Flow (interaktive Entscheidungen durchspielen)
- PDF-Export
- Admin: Wort-Limits ändern

**Aufwand:** 2–3 Stunden

---

## ✅ Erledigt (Referenz)

### Infrastruktur & Deployment

- [x] Dual-DB Adapter — SQLite (Pi) + Neon Postgres (Vercel), automatisch erkannt via async ESM `import()`
- [x] Raspberry Pi systemd-Service — Auto-Start, Auto-Restart
- [x] `deploy.ps1` — vollautomatisches Deployment: Backup → Bundle → Upload → Build → Service
- [x] Automatisches DB-Backup vor jedem Pi-Deploy (in `backups/`)
- [x] Vercel: Neon-Datenbank verbunden, Auto-Deploy bei Push auf `master`
- [x] Vercel: 500-Fehler behoben (ESM-Adapter-Laden + JSON-Parse bei Admin-Passwort)

### CI / Qualität

- [x] GitHub Actions CI — Lint ✓ · Tests ✓ · Build ✓ (Node 22, actions/setup-node@v4)
- [x] ESLint v9 Flat Config (`eslint.config.mjs`) — `next lint` war in Next.js 16 entfernt
- [x] 58 Jest-Tests — alle bestanden
- [x] Playwright E2E (`npm run test:e2e`) — korrekt von Jest isoliert, Config an Projektwurzel
- [x] TypeScript — keine Fehler, keine `any`-Casts mehr in Produktionscode

### Features

- [x] Character Sheet mit 5 Feldern
- [x] 6-Stationen-Editor mit Wort-Limits (konfigurierbar)
- [x] ChoiceCard — 2–3 Entscheidungen, Konsequenz-Anzeige, Diamond-Pattern
- [x] Inventar-System inline im Editor
- [x] Auto-Save (500 ms Debounce) + expliziter Save bei Navigation
- [x] Story-Code-Label im Header
- [x] Interaktiver Reader (inkjs, 5-Phasen State Machine)
- [x] Fortschrittsleiste im Reader (6 Punkte)
- [x] Zusammenfassung aller Entscheidungen am Ende des Readers
- [x] Server-seitige Ink-Kompilierung (API-Route)
- [x] Admin-Board mit Liste, Abschließen, Löschen
- [x] Admin-Tabelle virtualisiert (react-window) für große Story-Mengen
- [x] Font-Preload-Warnung behoben (`inter.className` statt CSS-Variable)
