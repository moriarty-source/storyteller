# Deployment Guide

Storyteller läuft auf zwei Plattformen gleichzeitig. Die Datenbankwahl erfolgt automatisch per Env-Variable:
- **Kein Postgres-URL** → SQLite (Raspberry Pi, Lokal)
- **Postgres-URL vorhanden** → Neon Postgres (Vercel)

---

## Raspberry Pi (Lokal / Schulnetzwerk)

### Deployment

Auf dem Windows-Rechner, der mit dem Pi verbunden ist:

```powershell
# Im Projektordner:
.\deploy.ps1
# oder explizit:
.\deploy.ps1 -PiIp 192.168.178.70 -SshKey "C:\Users\Offic\.ssh\raspi_key"
```

Das Script führt automatisch folgende Schritte aus:
1. **Backup** — Lädt `stories.db` vom Pi in `backups/stories-DATUM.db`
2. **Bundle** — Erstellt einen Git-Bundle mit allen lokalen Commits
3. **Upload** — Überträgt den Bundle via SCP auf den Pi
4. **Build** — Klont das Repo, führt `npm ci` + `npm run build` aus
5. **Service** — Installiert und startet den systemd-Service `storyteller`

### Service verwalten (auf dem Pi)

```bash
sudo systemctl status storyteller    # Status prüfen
sudo systemctl restart storyteller   # Neustart
sudo journalctl -u storyteller -f    # Live-Logs
```

### Manuelles Backup der Datenbank

```powershell
# Vom Windows-Rechner aus:
scp -i "C:\Users\Offic\.ssh\raspi_key" pi@192.168.178.70:/home/pi/storyteller/data/stories.db backups/stories-manual.db
```

**Wichtig:** `data/stories.db` ist in `.gitignore` — Daten bleiben bei Deployments erhalten, werden aber nicht versioniert. Das Script legt automatisch vor jedem Deploy ein Backup unter `backups/` an (ebenfalls in `.gitignore`).

### Netzwerk-Zugriff für Schüler

1. Pi und Geräte im gleichen WLAN
2. URL: `http://192.168.178.70:3000`
3. Test: `curl http://192.168.178.70:3000` vom Pi selbst

---

## Vercel (Cloud)

### Updates deployen

```bash
git push origin master
```

Vercel deployed automatisch bei jedem Push auf `master`. Die CI-Pipeline (GitHub Actions) läuft davor: Lint → Tests → Build.

### Erstinstallation (eigene Instanz)

1. Repository auf GitHub forken: https://github.com/moriarty-source/storyteller
2. Auf Vercel importieren: https://vercel.com/new → GitHub-Repo auswählen → Deploy
3. Neon-Datenbank verknüpfen:
   - Vercel Dashboard → **Storage** → **Create Database** → **Neon**
   - Name wählen, Region `Frankfurt (eu-central-1)`
   - **Connect** — Vercel setzt `POSTGRES_URL` automatisch und triggert Redeploy

### Env-Variablen

| Variable | Wert | Wann |
|---|---|---|
| `POSTGRES_URL` | (von Vercel/Neon automatisch) | Vercel — Standard-Prefix |
| `STORAGE_URL` | (von Vercel/Neon automatisch) | Vercel — wenn Prefix „STORAGE" gewählt |
| `DATABASE_URL` | (manuell) | Legacy-Fallback |
| `DB_PATH` | `/pfad/zur/stories.db` | Pi/Lokal — optional, Standard: `data/stories.db` |

Der Adapter prüft alle drei Postgres-Variablen in dieser Reihenfolge. Eine davon reicht.

---

## Lokal (Entwicklung)

```bash
npm install
npm run dev      # Dev-Server auf http://localhost:3000
npm test         # Jest Unit-Tests
npm run lint     # ESLint
npm run build    # Production Build prüfen
```

Keine Datenbank-Konfiguration nötig — SQLite wird unter `data/stories.db` angelegt.

Env-Vars für lokale Entwicklung: siehe `.env.example`.

---

## Troubleshooting

### Pi: Build schlägt fehl (npm not found)

Das `deploy.ps1`-Script erkennt den npm-Pfad automatisch über `command -v npm`. Falls das fehlschlägt, Build manuell über SSH:

```bash
ssh -i "C:\Users\Offic\.ssh\raspi_key" pi@192.168.178.70 \
  "export NVM_DIR=~/.nvm && . ~/.nvm/nvm.sh && cd ~/storyteller && npm ci && npm run build && sudo systemctl restart storyteller"
```

### iPads können nicht verbinden

- Gleiches WLAN sicherstellen
- IP-Adresse prüfen: `hostname -I` auf dem Pi
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

src/lib/db-adapter.ts        ← Factory + DbAdapter Interface (async ESM import)
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
