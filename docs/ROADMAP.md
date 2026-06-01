# ROADMAP — Storyteller

Offene Punkte, sortiert nach Priorität. Jeder Eintrag enthält Kontext und konkreten nächsten Schritt.

---

## 🚨 Blocker (vor nächstem Workshop beheben)

### Vercel: POSTGRES_URL fehlt
**Problem:** Die Neon-Datenbank `neon-emerald-cave` ist mit dem Vercel-Projekt verbunden, aber die Env-Variable wurde möglicherweise noch nicht korrekt propagiert. Story-Erstellung gibt 500 zurück.  
**Nächster Schritt:** Im Vercel Dashboard → Projekt `storyteller-app` → Settings → Environment Variables prüfen: muss `POSTGRES_URL`, `STORAGE_URL` oder `DATABASE_URL` für Production gesetzt sein.  
**Aufwand:** 5 Minuten (manuell im Browser)

---

## 🔴 Hoch (bald beheben)

### deploy.ps1: npm-Pfad-Erkennung unzuverlässig
**Problem:** Das Script versucht den npm-Pfad aus dem Build-Output zu extrahieren (`which npm`). Das schlägt bei interaktiven SSH-Shells manchmal fehl, was zum Build-Fehler „npm: command not found" führt.  
**Lösung:** npm-Pfad im Script hardcoden oder robuster per `command -v npm` ermitteln:
```powershell
$npmPath = "/home/pi/.nvm/versions/node/v22.22.3/bin/npm"
```
**Aufwand:** 30 Minuten

### Kein Backup-Mechanismus für Pi
**Problem:** Die SQLite-Datei `data/stories.db` liegt nur auf dem Pi. Bei Neuinstallation oder Defekt sind alle Geschichten verloren.  
**Lösung:** Backup-Script (automatisch vor jedem Deploy + manuell auslösbar):
```powershell
# In deploy.ps1 als Schritt 0 einfügen:
scp pi@$PiIp:/home/pi/storyteller/data/stories.db backups/stories-$(Get-Date -Format 'yyyy-MM-dd').db
```
**Aufwand:** 1 Stunde (Script + Backup-Verzeichnis + .gitignore-Eintrag)

---

## 🟡 Mittel (sinnvoll, kein Blocker)

### Story-Export im Admin-Board
**Problem:** Lehrkräfte können Geschichten nur ansehen, nicht exportieren. Bei Abschluss eines Workshops gibt es keinen einfachen Weg, alle Texte zu sichern.  
**Lösung A (einfach):** „Alle als ZIP exportieren" — JSON-Dateien aller Stories.  
**Lösung B (komplex):** PDF-Export pro Story direkt aus Admin-Board (nutzt bestehenden StoryDocument-Renderer).  
**Aufwand:** A = 2 Stunden, B = 4 Stunden

### Ink-Validierung beim Speichern
**Problem:** Fehler im Ink-Compiler werden erst sichtbar wenn Lehrkraft die Story „abschließt" — zu spät.  
**Lösung:** Beim Speichern jeder Station server-seitig `compileToInk()` aufrufen und Warnungen im Editor anzeigen (kein Hard-Block, nur Hinweis).  
**Aufwand:** 3 Stunden

### Admin-Passwort änderbar machen
**Problem:** Das Admin-Passwort kann nur im Admin-Board (ConfigPanel) geändert werden — aber der ConfigPanel zeigt momentan nur Wort-Limits. Das Passwort-Feld existiert im Backend (`setAdminPassword`), fehlt aber im UI.  
**Lösung:** Passwort-Feld im ConfigPanel ergänzen.  
**Aufwand:** 2 Stunden

---

## 🟢 Nice-to-have (langfristig)

### Flowchart-Visualisierung
Entscheidungsbaum der Geschichte grafisch darstellen — hilft Schülern bei der Planung. Bibliothek: `reactflow` oder `d3`.  
**Aufwand:** 1–2 Tage

### Statistiken im Admin-Board
Welche Entscheidungen treffen Leser am häufigsten? Erfordert Tracking beim Durchspielen des Readers (API-Call pro Entscheidung).  
**Aufwand:** 1 Tag

### Automatische Ink-Validierung (Echtzeit)
Während des Tippens Ink-Syntax-Fehler hervorheben — komplex, da Ink-Compiler nicht inkrementell ist.  
**Aufwand:** 2–3 Tage

### Mehrsprachigkeit
Interface auf Deutsch (aktuell) + optional Englisch. Framework: `next-intl`.  
**Aufwand:** 3–5 Tage

### Zurück-im-Reader-Navigation
„Letzte Entscheidung rückgängig" — absichtlich nicht gebaut (YAGNI), aber mehrfach gewünscht.  
**Aufwand:** 1 Tag (Ink-Story-State snapshotten)

---

## ✅ Erledigt (Referenz)

- [x] Character Sheet mit 5 Feldern
- [x] 6-Stationen-Editor mit Wort-Limits
- [x] ChoiceCard — 2–3 Entscheidungen, Konsequenz-Anzeige, Diamond-Pattern
- [x] Inventar-System inline im Editor
- [x] Auto-Save (500 ms Debounce) + expliziter Save bei Navigation
- [x] Story-Code-Label im Header
- [x] Interaktiver Reader (inkjs, 5-Phasen State Machine)
- [x] Fortschrittsleiste im Reader (6 Punkte, Amber/Indigo/Grau)
- [x] Zusammenfassung aller Entscheidungen am Ende des Readers
- [x] Server-seitige Ink-Kompilierung (API-Route)
- [x] Admin-Board mit Liste, Abschließen, Löschen
- [x] Konfigurierbare Wort-Limits im Admin-Board
- [x] Dual-DB Adapter (SQLite ↔ Neon Postgres)
- [x] Raspberry Pi systemd-Service + deploy.ps1
- [x] GitHub-Integration + Vercel Auto-Deploy
- [x] 53 Jest-Tests (Datenbank-Layer)
