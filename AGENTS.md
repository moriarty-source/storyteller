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
4. **Strategic Compacting**: Use /compact after completing significant task milestones.

## Startup Path
1. Read SESSION_STATE.md.
2. Follow project guidelines in CLAUDE.md.
3. Check tasks/todo.md.

## AWS Bedrock / Opus Integration

### 1. Wann soll Opus konsultiert werden?
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
