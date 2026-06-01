# Deployment Guide

Storyteller läuft auf zwei Plattformen gleichzeitig. Die Datenbankwahl erfolgt automatisch per Env-Variable:
- **Kein Postgres-URL** → SQLite (Raspberry Pi, Lokal)
- **Postgres-URL vorhanden** → Neon Postgres (Vercel)

---

## Raspberry Pi (Lokal / Schulnetzwerk)

### Erstinstallation

Auf dem Windows-Rechner, der mit dem Pi verbunden ist:

```powershell
# Im Projektordner:
.\deploy.ps1
# oder explizit:
.\deploy.ps1 -PiIp 192.168.178.70 -SshKey "C:\Users\Offic\.ssh\raspi_key"
```

Das Script:
1. Erstellt einen Git-Bundle mit allen lokalen Commits
2. Lädt den Bundle auf den Pi hoch (SCP)
3. Klont das Repo, führt `npm ci` + `npm run build` aus
4. Installiert und startet den systemd-Service `storyteller`

### Service verwalten (auf dem Pi)

```bash
sudo systemctl status storyteller    # Status prüfen
sudo systemctl restart storyteller   # Neustart
sudo journalctl -u storyteller -f    # Live-Logs
```

### Daten sichern

```bash
# Backup der SQLite-Datenbank (vom Windows-Rechner aus)
scp -i "C:\Users\Offic\.ssh\raspi_key" pi@192.168.178.70:/home/pi/storyteller/data/stories.db backup-$(date +%Y-%m-%d).db
```

**Wichtig:** `data/stories.db` ist in `.gitignore` — Daten bleiben bei Deployments erhalten, werden aber nicht versioniert. Vor jedem Re-Deploy Backup erstellen!

### Netzwerk-Zugriff für Schüler

1. Pi und iPads im gleichen WLAN
2. URL: `http://192.168.178.70:3000`
3. Test: `curl http://192.168.178.70:3000` vom Pi selbst

---

## Vercel (Cloud)

### Erstinstallation (eigene Instanz)

1. Repository auf GitHub forken: https://github.com/moriarty-source/storyteller
2. Auf Vercel importieren: https://vercel.com/new → GitHub-Repo auswählen → Deploy
3. Neon-Datenbank verknüpfen (siehe nächster Abschnitt)

### Datenbank einrichten (einmalig, ⚠️ noch ausstehend!)

Im Vercel Dashboard des Projekts:

1. **Storage** → **Create Database** → **Neon**
2. Name: `storyteller-db`, Region: `Frankfurt (eu-central-1)`
3. **Create & Continue** → **Connect**

Vercel setzt automatisch `POSTGRES_URL` (oder `STORAGE_URL` je nach Prefix-Wahl) und triggert ein neues Deployment.

**Aktuelle Instanz:** https://storyteller-app-cyan.vercel.app  
→ Neon-DB `neon-emerald-cave` ist bereits verbunden, Env-Var wird noch gesetzt.

### Updates deployen

```bash
git push origin master
```

Vercel deployed automatisch bei jedem Push auf `master`.

### Env-Variablen

| Variable | Wert | Wann |
|---|---|---|
| `POSTGRES_URL` | (von Vercel/Neon) | Vercel — Standard-Prefix |
| `STORAGE_URL` | (von Vercel/Neon) | Vercel — wenn Prefix „STORAGE" gewählt |
| `DATABASE_URL` | (von Vercel/Neon) | Vercel — Legacy-Fallback |
| `DB_PATH` | `/pfad/zur/stories.db` | Pi/Lokal — optional, Standard: `data/stories.db` |

Der Adapter prüft alle drei Postgres-Variablen in dieser Reihenfolge. Eine davon reicht.

---

## Lokal (Entwicklung)

```bash
npm install
npm run dev      # Dev-Server auf http://localhost:3000
```

Keine Datenbank-Konfiguration nötig — SQLite wird unter `data/stories.db` angelegt.

```bash
npm test         # 53 Tests
npm run build    # Production Build prüfen
```

Env-Vars für lokale Entwicklung: siehe `.env.example`.

---

## Troubleshooting

### Pi: „npm: command not found" beim Deploy

Das `deploy.ps1`-Script erkennt den npm-Pfad manchmal nicht korrekt. Workaround: Build manuell über SSH starten:

```bash
ssh -i "C:\Users\Offic\.ssh\raspi_key" pi@192.168.178.70 "bash -i -c 'cd ~/storyteller && npm ci && npm run build && sudo systemctl restart storyteller'"
```

### Vercel: 500 Internal Server Error bei Story-Erstellung

Ursache: Kein Postgres-URL gesetzt. Lösung: Neon-Datenbank im Vercel Dashboard unter Storage verknüpfen.

### iPads können nicht verbinden

- Gleiches WLAN sicherstellen
- IP-Adresse prüfen: `ipconfig` (Windows) / `ifconfig` (Linux)
- Firewall: Port 3000 TCP eingehend freigeben

### Port 3000 belegt

```bash
PORT=3001 npm start
```

---

## Datenbank-Adapter Architektur

```
POSTGRES_URL / STORAGE_URL / DATABASE_URL gesetzt?
    ja  → PostgresAdapter (@neondatabase/serverless)
          HTTP-basiert, kein Connection-Pool nötig, serverless-optimiert
    nein → SqliteAdapter (better-sqlite3)
           synchron, dateibasiert, zero-config

src/lib/db-adapter.ts       ← Factory + DbAdapter Interface
src/lib/adapters/postgres.ts ← Neon-Implementierung
src/lib/adapters/sqlite.ts   ← SQLite-Implementierung
src/lib/stories.ts           ← async CRUD-Wrapper
src/lib/config.ts            ← async Config-Wrapper
src/lib/adminAuth.ts         ← Admin-Auth (x-admin-password Header)
```

Schema (identisch für beide Backends):

```sql
CREATE TABLE stories (
  code       TEXT PRIMARY KEY,
  status     TEXT DEFAULT 'active',  -- 'active' | 'completed'
  character  TEXT,                   -- JSON
  world      TEXT,                   -- JSON
  inventory  TEXT,                   -- JSON
  stations   TEXT,                   -- JSON
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE config (
  key   TEXT PRIMARY KEY,
  value TEXT  -- JSON
);
-- Seeded defaults: wordLimits, adminPassword ('admin')
```
