# Storyteller: Dokumentation & Offene Aufgaben (Stand: 03. Juni 2026)

Dieses Dokument gibt einen Überblick über die durchgeführten Arbeiten zur Behebung der 500-Fehler auf Vercel, den aktuellen Status der Web-Applikation und die nächsten Schritte für die zukünftige Arbeit.

---

## 1. Was wurde getan & gelöst?

### Problem A: Serverless-Abstürze beim Laden von Datenbank-Adaptern
* **Ursache:** Next.js Serverless-Funktionen auf Vercel bündeln Module zur Build-Zeit. Die Verwendung von dynamischen `require()`-Statements im Datenbank-Adapter-Factory-Muster (`db-adapter.ts`) führte dazu, dass die Adapter im gebündelten Serverless-Code nicht gefunden wurden. Beim Versuch, Geschichten zu erstellen oder abzurufen, stürzte die Serverless-Funktion mit einem `TypeError: PostgresAdapter is not a constructor` ab.
* **Lösung:**
  1. `getAdapter()` in `src/lib/db-adapter.ts` wurde in eine asynchrone Funktion umgewandelt und nutzt nun modernes ESM `import()` für ein verlässliches Laden der Module im Serverless-Kontext.
  2. Alle Aufrufer in `src/lib/stories.ts` und `src/lib/config.ts` wurden aktualisiert, um `await getAdapter()` korrekt zu erwarten.
  3. Die API-Routen wurden mit Try-Catch-Blöcken versehen, um im Fehlerfall sauberes JSON-Fehler-Feedback (inklusive Log-Ausgaben in Vercel) zurückzugeben, statt stumm mit 500er-Schnittstellen abzustürzen.

### Problem B: JSON-Parser-Fehler beim Admin-Passwort ("Unexpected token 'a' in JSON")
* **Ursache:** Die Datenbank speicherte das Standard-Admin-Passwort als rohen Text `"admin"` (ohne doppelte JSON-Anführungszeichen). Der Postgres/SQLite-Adapter versuchte jedoch, diesen Wert direkt mit `JSON.parse` zu deserialisieren, was mit einem `SyntaxError` fehlschlug.
* **Lösung:**
  * Die Methoden `getAdminPassword()` sowohl im Postgres-Adapter (`src/lib/adapters/postgres.ts`) als auch im SQLite-Adapter (`src/lib/adapters/sqlite.ts`) wurden robuster gestaltet: Wenn das Auslesen fehlschlägt, wird die Exception abgefangen und der Text im Rohformat zurückgegeben.

---

## 2. Aktueller Status

* **Vercel-Deployment:** Voll funktionsfähig unter [storyteller-app-cyan.vercel.app](https://storyteller-app-cyan.vercel.app).
* **Funktionstests (Live-System):**
  * **Geschichte erstellen (POST `/api/stories`):** Liefert erfolgreich `201 Created` mit einer neuen Geschichte zurück (z. B. Code `VNTG` oder `NYHH`).
  * **Einzelne Geschichte abrufen (GET `/api/stories/[code]`):** Liefert die JSON-Struktur der Geschichte im Status `200 OK` zurück.
  * **Admin-Dashboard & API (GET `/api/admin/stories`):** Lädt alle Geschichten erfolgreich im Status `200 OK` und authentifiziert das Admin-Passwort fehlerfrei.

---

## 3. Todos & Notwendige Schritte für die Zukunft

Da die Applikation nun fehlerfrei auf Vercel läuft, sind hier die empfohlenen nächsten Schritte für die Pflege und Weiterentwicklung:

### [ ] Lokales Setup auf dem Raspberry Pi synchronisieren *(manuell — erfordert SSH)*
* Falls Änderungen auf dem Raspberry Pi eingespielt werden sollen, muss das dortige Verzeichnis aktualisiert und die App neu gebaut werden (`npm run build`).
* Die lokalen Änderungen wurden in der Git-Struktur dieses Repositories vorgenommen und sind bereit zum Committen und Pushen/Übertragen via Bundle.

### [x] E2E-Tests anpassen (Playwright) *(erledigt, 03.06.2026)*
* `playwright.config.ts` an die Projektwurzel verschoben — `testDir: './e2e'` zeigt nun korrekt auf `e2e/`.
* `jest.config.ts` um `testPathIgnorePatterns: ['/e2e/']` erweitert — Jest lädt keine Playwright-Specs mehr.
* Neues npm-Skript: `npm run test:e2e`

### [x] Fonts und Preload-Warnungen optimieren *(erledigt, 03.06.2026)*
* `src/app/layout.tsx`: `inter.variable` durch `inter.className` ersetzt — Font wird jetzt tatsächlich genutzt, Preload-Warnung entfällt.

---

## 4. Git-Status vor dem Verlassen

Alle Änderungen sind lokal stabil, kompilieren sauber mit `npm run build` und wurden erfolgreich auf Vercel deployt.
Es wurde kein Git-Commit durchgeführt (dies bleibt dir überlassen).

Du kannst dieses Dokument jederzeit öffnen und genau an dieser Stelle fortfahren!
