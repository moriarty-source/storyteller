# CLAUDE.md (Storyteller)

> [!CAUTION]
> **OS & SHELL CONSTRAINTS (WINDOWS POWERSHELL 5.1)**
> - NEVER use `&&` or `||`. Use `;`.
> - NEVER use command substitution `$(...)`.
> - ALWAYS quote paths with single quotes.

## 1. Understanding Storyteller
**WHAT**: Next.js-basierte Storytelling-Plattform.
**STACK**: Next.js, React, Tailwind CSS, TypeScript, Neon Serverless (PostgreSQL), better-sqlite3, inkjs (Ink integration).

## 2. Core Commands
- `npm run dev` - Start development server.
- `npm run build` - Compile production bundle.
- `npm run lint` - Lint source files in `src/`.
- `npm run test` - Run Jest tests.
- `npm run test:e2e` - Run Playwright E2E tests.

## 3. Architecture
- `src/` - Frontend components, pages, hooks, state.
- `docs/` - Project documentation, specs, plans.
- `data/` - Database seed data or SQLite files.

## 4. Guidelines
- Follow efficiency rules in `AGENTS.md`.
- Keep `SESSION_STATE.md` updated at the end of each session.
- Document any architectural decisions in `docs/superpowers/specs/`.
