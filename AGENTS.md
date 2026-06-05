# AGENTS.md

> [!CAUTION]
> **OS & SHELL CONSTRAINTS (WINDOWS POWERSHELL 5.1)**
> - NEVER use && or ||. Use ; to chain commands.
> - NEVER use mkdir -p. Use native PowerShell commands or let tools handle directory creation.
> - NEVER use command substitution $(...). Use local variables if needed.
> - ALWAYS quote paths with single quotes.

## Efficiency Standards
1. **No Conversational Overhead**: Execute tools immediately without narrating or explaining.
2. **Direct Tool Usage**: Perform actions first, analyze logs only to verify outcomes or debug.
3. **Minimize Formatting**: Avoid large tables or over-structured chat replies.
4. **Strategic Compacting**: Use `/compact` after completing significant task milestones or large command outputs to keep context clean and response times fast.
5. **Command Chaining**: Chain commands with `;` (PowerShell compliant) to save execution cycles.
6. **Background Execution**: Run time-consuming processes in the background and continue analysis/planning in parallel.
7. **Gateguard (Analyze before Edit)**: Read and analyze type definitions, database schemas, and API contracts before modifying code.
8. **TDD & Verification Loops**: Implement/update tests before editing core logic. Validate via linting/tests before declaring a task complete.

## Documentation Standards
- **Unified Structure**: Documentation must follow a consistent structure and be written into the same standard files across all projects (e.g., `AGENTS.md`, `CLAUDE.md`, `SESSION_STATE.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`) to maintain clear and traceable project structures.
- **Active Archiving**: Keep `task.md`/`todo.md` clean. Move completed tasks `[x]` to a separate archive file (or section) to prevent token bloat. Only current sprint/task items remain active.
- **Lightweight Referencing**: Never paste verbose stack traces or full code blocks into documentation. Use clickable file links (e.g. `[main.ts](file:///...)` with line numbers) instead.
- **Cleanup on Session End**: Ensure all test-generated storage roots (e.g. `*-test-*` folders) and database/runtime caches are wiped before terminating a session.

## Feierabend-Checkliste
Vor dem Beenden der Arbeit (Feierabend) muss die Code-Qualität gesichert und das Repository aufgeräumt werden. Führe dazu folgende Schritte aus:
1. **Qualitäts-Check & Build**: `npm run lint; npm run test; npm run build` (bzw. `pnpm` in Torquemada) – alles muss fehlerfrei durchlaufen.
2. **Cleanup**: Test-Verzeichnisse (`*-test-*` oder sonstige temporäre Dateien) löschen.
3. **Status-Dokumentation**: `SESSION_STATE.md` aktualisieren: getane Arbeit abhaken, offene Punkte in `task.md`/`todo.md` listen und erledigte Punkte archivieren.
4. **Git-Status**: `git status` prüfen, um sicherzustellen, dass keine temporären Dateien im Git-Index liegen und alle Änderungen committed sind.

## Startup Path
1. Read SESSION_STATE.md.
2. Follow project guidelines in CLAUDE.md.
3. Check tasks/todo.md.

## AWS Bedrock / Opus Integration

### 1. Wann soll Opus konsultiert werden?
- Standardmäßig als Consultant für komplexe Fragen über das Skript `scripts/ask-opus.cjs`. Dabei ist es wichtig, Opus eine sehr genaue Beschreibung des Problems sowie ausreichend Kontext zur Verfügung zu stellen.
- Bei komplexen Architektur-Entscheidungen (z. B. Schema-Design, API-Routen).
- Für Sicherheits-Reviews und Performance-Audits.
- Bei "hartnäckigen" Bugs, die nach 3 Iterationen nicht gelöst sind.

### 2. CLI-Benutzung
Verwende das lokale Proxy-Skript:
```powershell
# Direktes Prompting
node scripts/ask-opus.cjs "Wie strukturiere ich ein Yjs-Update-Backup in PostgreSQL?"

# Konsultation über Textdatei (Empfohlen für Code-Reviews)
Get-Content docs/opus/review-input.txt | node scripts/ask-opus.cjs > docs/opus/review-output.md
```

### 3. Agenten-MCP-Nutzung
Nutze das registrierte MCP-Tool:
`ask_opus(prompt, systemPrompt?, temperature?, maxTokens?)`

## Guardrails for Smaller/Weaker Models (Anti-Loop & Hallucination)
1. **Zustands-Verankerung**: Nutze `SESSION_STATE.md` und `task.md` zur kontinuierlichen Status-Dokumentation. Markiere Teilschritte sofort nach Fertigstellung als `[x]`, um Wiederholungsschleifen zu vermeiden.
2. **Strikte Phasentrennung**: Erst lesen und analysieren (Typdefinitionen, DB-Schemas, API-Schnittstellen prüfen), dann den Entwurf mit dem Benutzer abstimmen, und erst nach Freigabe implementieren.
3. **Mikro-Tasks**: Teile komplexe Probleme in atomare Einzelschritte auf und bearbeite diese nacheinander, anstatt große Feature-Sets auf einmal zu implementieren.
4. **Fokussierter Kontext**: Lies nur relevante Dateiausschnitte (zeilengenaue Lesevorgänge) statt ganzer Dateien, und nutze `/compact` zur regelmäßigen Bereinigung des Chatverlaufs.
5. **Anti-Loop-Abbruch**: Wenn ein Test- oder Build-Fehler nach 2 Korrekturversuchen nicht gelöst ist, stoppe sofort jede weitere Codeänderung und frage den Benutzer um Rat.

