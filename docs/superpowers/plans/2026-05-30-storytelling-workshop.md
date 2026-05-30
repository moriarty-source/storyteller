# Storytelling Workshop Tool — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based interactive story editor for 6th/7th grade students using Next.js, SQLite, and inkjs, hosted on a Raspberry Pi.

**Architecture:** Next.js App Router with API routes for data persistence, better-sqlite3 for local SQLite storage, inkjs for story compilation, and react-pdf for PDF export. No auth — stories accessed via 4-character codes only.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, better-sqlite3, inkjs, react-pdf, Jest + React Testing Library

---

## File Map

```
app/
  layout.tsx                   # Root layout: Inter font, global styles
  page.tsx                     # Landing page: new story / enter code
  globals.css                  # Tailwind + CSS custom properties
  [code]/
    page.tsx                   # Story editor (active) or redirect to /view
    view/
      page.tsx                 # Read-only completed story + PDF export
  admin/
    layout.tsx                 # Admin password gate
    page.tsx                   # Admin board
  api/
    stories/
      route.ts                 # POST: create story
      [code]/
        route.ts               # GET: fetch, PATCH: update
    admin/
      stories/
        route.ts               # GET: all stories
        [code]/
          route.ts             # PATCH: complete story
      config/
        route.ts               # GET + PATCH: word limits
    export/
      [code]/
        route.ts               # GET: ink string output

components/
  landing/
    LandingPage.tsx            # New + code entry UI
  editor/
    StoryEditor.tsx            # Main editor shell + autosave logic
    CharacterCard.tsx          # Sticky left sidebar
    InventoryList.tsx          # Inventory within CharacterCard
    StationProgress.tsx        # Right sidebar dots
    CharacterSheet.tsx         # Station 0: world + character form
    StationEditor.tsx          # Stations 1–6: text + choices
    WordCounter.tsx            # Live word count with warning
    ChoiceCard.tsx             # Single choice + consequence editor
    SaveIndicator.tsx          # Header save feedback
  view/
    StoryView.tsx              # Formatted completed story
    StoryDocument.tsx          # react-pdf Document component
  admin/
    AdminBoard.tsx             # Stories table
    ConfigPanel.tsx            # Word limits config editor

lib/
  db.ts                        # SQLite singleton connection
  stories.ts                   # Story CRUD (read/write/list/complete)
  config.ts                    # Config read/write (word limits, admin pw)
  codeGenerator.ts             # 4-char code generator
  inkCompiler.ts               # Story data → .ink string
  wordCount.ts                 # Word counting utility

types/
  story.ts                     # All shared TypeScript types

__tests__/
  lib/
    codeGenerator.test.ts
    inkCompiler.test.ts
    wordCount.test.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1: Scaffold Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

- [ ] **Step 2: Install dependencies**

```bash
npm install better-sqlite3 inkjs @react-pdf/renderer
npm install --save-dev @types/better-sqlite3 jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom ts-jest
```

- [ ] **Step 3: Configure Jest**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathPattern: '__tests__',
}

export default config
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 5: Set up root layout with Inter font**

Replace `app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Story Maker',
  description: 'Schreib deine eigene Geschichte',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${inter.className} bg-white text-[#1A1A1A] antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Set up globals.css with custom properties**

Replace `app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --amber: #F59E0B;
  --indigo: #4F46E5;
  --amber-light: #FEF3C7;
  --text: #1A1A1A;
  --bg: #FFFFFF;
  --bg-subtle: #F9F9F9;
}

* {
  -webkit-tap-highlight-color: transparent;
}

textarea {
  resize: none;
}
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js project with dependencies"
```

---

## Task 2: Types

**Files:**
- Create: `types/story.ts`

- [ ] **Step 1: Write types**

Create `types/story.ts`:
```typescript
export type Strength = 'Mutig' | 'Schlau' | 'Einfühlsam' | 'Stark'

export interface Character {
  name: string
  strength: Strength
  weakness: string
  goal: string
  secret: string
}

export interface World {
  description: string
  problem: string
}

export interface Choice {
  label: string
  consequence: string
}

export interface Station {
  id: number       // 1–6
  text: string
  choices: Choice[]
  completed: boolean
}

export type StoryStatus = 'active' | 'completed'

export interface Story {
  code: string
  status: StoryStatus
  character: Character
  world: World
  inventory: string[]
  stations: Station[]
  createdAt: string
  updatedAt: string
}

export interface WordLimits {
  station1: number
  station2: number
  station3: number
  station4: number
  station5: number
  station6: number
  consequence: number
}

export interface Config {
  wordLimits: WordLimits
  adminPassword: string
}

export const DEFAULT_WORD_LIMITS: WordLimits = {
  station1: 120,
  station2: 150,
  station3: 150,
  station4: 200,
  station5: 240,
  station6: 150,
  consequence: 60,
}

export const STATION_NAMES: Record<number, string> = {
  1: 'Ruf zum Abenteuer',
  2: 'Weigerung / Zögern',
  3: 'Mentor / Hilfe',
  4: 'Erste Prüfung',
  5: 'Höhepunkt',
  6: 'Rückkehr',
}

export const STATION_TIPS: Record<number, { short: string; long: string }> = {
  1: {
    short: 'Was bricht die Routine deines Charakters?',
    long: 'Etwas Unerwartetes passiert — ein Brief, ein Geräusch, eine Begegnung. Dein Charakter muss reagieren. Was zieht ihn in das Abenteuer?',
  },
  2: {
    short: 'Warum zögert dein Charakter?',
    long: 'Niemand springt sofort ins Unbekannte. Was hält deinen Charakter zurück? Angst, Zweifel, Verantwortung? Zeig den inneren Konflikt.',
  },
  3: {
    short: 'Wer oder was hilft deinem Charakter?',
    long: 'Ein weiser Mensch, ein Gegenstand, ein Tier — irgendjemand oder etwas gibt deinem Charakter den nötigen Mut oder ein Werkzeug für die Reise.',
  },
  4: {
    short: 'Was stellt sich deinem Charakter in den Weg?',
    long: 'Die erste echte Herausforderung. Ein Hindernis, ein Gegner, ein Rätsel. Wie reagiert dein Charakter? Was kostet ihn das?',
  },
  5: {
    short: 'Der entscheidende Moment — alles steht auf dem Spiel.',
    long: 'Dein Charakter steht vor der größten Prüfung. Alles, was er bisher erlebt hat, kommt hier zusammen. Was muss er opfern oder riskieren?',
  },
  6: {
    short: 'Wie kehrt dein Charakter zurück — und was hat sich verändert?',
    long: 'Das Abenteuer endet, aber dein Charakter ist nicht mehr dieselbe Person. Was nimmt er mit? Was hat er verloren oder gewonnen?',
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add types/story.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Utility Libraries

**Files:**
- Create: `lib/wordCount.ts`, `lib/codeGenerator.ts`
- Create: `__tests__/lib/wordCount.test.ts`, `__tests__/lib/codeGenerator.test.ts`

- [ ] **Step 1: Write wordCount tests**

Create `__tests__/lib/wordCount.test.ts`:
```typescript
import { countWords, isNearLimit, isOverLimit } from '@/lib/wordCount'

describe('countWords', () => {
  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0)
  })

  it('counts words correctly', () => {
    expect(countWords('Hallo Welt heute')).toBe(3)
  })

  it('ignores extra whitespace', () => {
    expect(countWords('  Hallo   Welt  ')).toBe(2)
  })

  it('handles newlines', () => {
    expect(countWords('Hallo\nWelt')).toBe(2)
  })
})

describe('isNearLimit', () => {
  it('returns true when count >= 80% of limit', () => {
    expect(isNearLimit(80, 100)).toBe(true)
    expect(isNearLimit(96, 120)).toBe(true)
  })

  it('returns false when below 80%', () => {
    expect(isNearLimit(79, 100)).toBe(false)
  })
})

describe('isOverLimit', () => {
  it('returns true when count exceeds limit', () => {
    expect(isOverLimit(101, 100)).toBe(true)
  })

  it('returns false at limit', () => {
    expect(isOverLimit(100, 100)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx jest __tests__/lib/wordCount.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/wordCount'`

- [ ] **Step 3: Implement wordCount**

Create `lib/wordCount.ts`:
```typescript
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function isNearLimit(count: number, limit: number): boolean {
  return count >= Math.floor(limit * 0.8)
}

export function isOverLimit(count: number, limit: number): boolean {
  return count > limit
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx jest __tests__/lib/wordCount.test.ts
```

- [ ] **Step 5: Write codeGenerator tests**

Create `__tests__/lib/codeGenerator.test.ts`:
```typescript
import { generateCode, isValidCode } from '@/lib/codeGenerator'

describe('generateCode', () => {
  it('returns a 4-character string', () => {
    expect(generateCode()).toHaveLength(4)
  })

  it('only uses uppercase letters and digits', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateCode()).toMatch(/^[A-Z0-9]{4}$/)
    }
  })

  it('avoids ambiguous characters', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCode()
      expect(code).not.toMatch(/[0OIL1]/)
    }
  })
})

describe('isValidCode', () => {
  it('returns true for valid codes', () => {
    expect(isValidCode('K7M2')).toBe(true)
    expect(isValidCode('ABCD')).toBe(true)
  })

  it('returns false for wrong length', () => {
    expect(isValidCode('ABC')).toBe(false)
    expect(isValidCode('ABCDE')).toBe(false)
  })

  it('returns false for lowercase', () => {
    expect(isValidCode('abcd')).toBe(false)
  })
})
```

- [ ] **Step 6: Run tests — expect FAIL**

```bash
npx jest __tests__/lib/codeGenerator.test.ts
```

- [ ] **Step 7: Implement codeGenerator**

Create `lib/codeGenerator.ts`:
```typescript
// Excludes ambiguous chars: 0, O, I, L, 1
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateCode(): string {
  return Array.from({ length: 4 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
}

export function isValidCode(code: string): boolean {
  return /^[A-Z0-9]{4}$/.test(code)
}
```

- [ ] **Step 8: Run tests — expect PASS**

```bash
npx jest __tests__/lib/codeGenerator.test.ts
```

- [ ] **Step 9: Commit**

```bash
git add lib/wordCount.ts lib/codeGenerator.ts __tests__/lib/
git commit -m "feat: add wordCount and codeGenerator utilities with tests"
```

---

## Task 4: Ink Compiler

**Files:**
- Create: `lib/inkCompiler.ts`
- Create: `__tests__/lib/inkCompiler.test.ts`

- [ ] **Step 1: Write inkCompiler tests**

Create `__tests__/lib/inkCompiler.test.ts`:
```typescript
import { compileToInk } from '@/lib/inkCompiler'
import type { Story } from '@/types/story'

const minimalStory: Story = {
  code: 'TEST',
  status: 'active',
  character: {
    name: 'Lena',
    strength: 'Mutig',
    weakness: 'Ungeduldig',
    goal: 'Schwester finden',
    secret: '',
  },
  world: {
    description: 'Eine dunkle Stadt',
    problem: 'Alle Lichter erlöschen',
  },
  inventory: ['Schlüssel'],
  stations: [
    {
      id: 1,
      text: 'Lena hörte ein Geräusch.',
      choices: [
        { label: 'Nachsehen', consequence: 'Sie fand eine Tür.' },
        { label: 'Weglaufen', consequence: 'Sie rannte durch die Gasse.' },
      ],
      completed: true,
    },
  ],
  createdAt: '',
  updatedAt: '',
}

describe('compileToInk', () => {
  it('declares character variables', () => {
    const ink = compileToInk(minimalStory)
    expect(ink).toContain('VAR charakter_name = "Lena"')
    expect(ink).toContain('VAR charakter_staerke = "Mutig"')
  })

  it('declares inventory variables', () => {
    const ink = compileToInk(minimalStory)
    expect(ink).toContain('VAR item_schluessel = true')
  })

  it('generates station knot', () => {
    const ink = compileToInk(minimalStory)
    expect(ink).toContain('=== station_1 ===')
    expect(ink).toContain('Lena hörte ein Geräusch.')
  })

  it('generates choices with consequences', () => {
    const ink = compileToInk(minimalStory)
    expect(ink).toContain('* [Nachsehen]')
    expect(ink).toContain('Sie fand eine Tür.')
    expect(ink).toContain('* [Weglaufen]')
    expect(ink).toContain('Sie rannte durch die Gasse.')
  })

  it('uses gather to continue to next station', () => {
    const ink = compileToInk(minimalStory)
    expect(ink).toContain('- -> station_2')
  })

  it('ends last station with END', () => {
    const storyWithStation6: Story = {
      ...minimalStory,
      stations: [{ id: 6, text: 'Sie kehrte zurück.', choices: [], completed: true }],
    }
    const ink = compileToInk(storyWithStation6)
    expect(ink).toContain('- -> END')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx jest __tests__/lib/inkCompiler.test.ts
```

- [ ] **Step 3: Implement inkCompiler**

Create `lib/inkCompiler.ts`:
```typescript
import type { Story } from '@/types/story'

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export function compileToInk(story: Story): string {
  const lines: string[] = []

  // Variables: character
  lines.push(`VAR charakter_name = "${story.character.name}"`)
  lines.push(`VAR charakter_staerke = "${story.character.strength}"`)
  lines.push(`VAR charakter_schwaeche = "${story.character.weakness}"`)
  lines.push(`VAR charakter_ziel = "${story.character.goal}"`)
  if (story.character.secret) {
    lines.push(`VAR charakter_geheimnis = "${story.character.secret}"`)
  }
  lines.push('')

  // Variables: inventory
  for (const item of story.inventory) {
    lines.push(`VAR item_${slugify(item)} = true`)
  }
  if (story.inventory.length > 0) lines.push('')

  // World intro
  lines.push('=== start ===')
  lines.push(story.world.description)
  if (story.world.problem) {
    lines.push(story.world.problem)
  }
  lines.push('')

  // Find first station or go to END
  const firstStation = story.stations[0]
  if (firstStation) {
    lines.push(`-> station_${firstStation.id}`)
  } else {
    lines.push('-> END')
  }
  lines.push('')

  // Stations
  for (let i = 0; i < story.stations.length; i++) {
    const station = story.stations[i]
    const nextStation = story.stations[i + 1]
    const nextTarget = nextStation ? `station_${nextStation.id}` : 'END'

    lines.push(`=== station_${station.id} ===`)
    lines.push(station.text)
    lines.push('')

    for (const choice of station.choices) {
      lines.push(`* [${choice.label}]`)
      if (choice.consequence) {
        lines.push(`  ${choice.consequence}`)
      }
    }

    lines.push(`- -> ${nextTarget}`)
    lines.push('')
  }

  lines.push('=== END ===')

  return lines.join('\n')
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx jest __tests__/lib/inkCompiler.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/inkCompiler.ts __tests__/lib/inkCompiler.test.ts
git commit -m "feat: add inkCompiler with tests"
```

---

## Task 5: Database Layer

**Files:**
- Create: `lib/db.ts`, `lib/stories.ts`, `lib/config.ts`

- [ ] **Step 1: Create database connection singleton**

Create `lib/db.ts`:
```typescript
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'stories.db')

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(DB_PATH)

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL')

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS stories (
    code TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'active',
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

// Seed default config if not present
const existingConfig = db.prepare('SELECT key FROM config WHERE key = ?').get('word_limits')
if (!existingConfig) {
  const { DEFAULT_WORD_LIMITS } = require('../types/story')
  db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run(
    'word_limits',
    JSON.stringify(DEFAULT_WORD_LIMITS)
  )
}

const existingPw = db.prepare('SELECT key FROM config WHERE key = ?').get('admin_password')
if (!existingPw) {
  db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run(
    'admin_password',
    JSON.stringify('workshop2024')
  )
}

export default db
```

- [ ] **Step 2: Create stories CRUD**

Create `lib/stories.ts`:
```typescript
import db from './db'
import { generateCode } from './codeGenerator'
import type { Story, Character, World, Station } from '@/types/story'

function deserialize(row: { code: string; status: string; data: string; created_at: string; updated_at: string }): Story {
  const data = JSON.parse(row.data)
  return {
    code: row.code,
    status: row.status as Story['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...data,
  }
}

export function createStory(): Story {
  let code = generateCode()
  // Ensure uniqueness
  while (db.prepare('SELECT code FROM stories WHERE code = ?').get(code)) {
    code = generateCode()
  }

  const now = new Date().toISOString()
  const emptyData = {
    character: { name: '', strength: 'Mutig', weakness: '', goal: '', secret: '' },
    world: { description: '', problem: '' },
    inventory: [],
    stations: [1, 2, 3, 4, 5, 6].map(id => ({
      id,
      text: '',
      choices: [],
      completed: false,
    })),
  }

  db.prepare(`
    INSERT INTO stories (code, status, data, created_at, updated_at)
    VALUES (?, 'active', ?, ?, ?)
  `).run(code, JSON.stringify(emptyData), now, now)

  return getStory(code)!
}

export function getStory(code: string): Story | null {
  const row = db.prepare('SELECT * FROM stories WHERE code = ?').get(code) as any
  if (!row) return null
  return deserialize(row)
}

export function updateStory(code: string, patch: Partial<Pick<Story, 'character' | 'world' | 'inventory' | 'stations'>>): Story | null {
  const existing = getStory(code)
  if (!existing) return null

  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() }
  const { character, world, inventory, stations } = updated

  db.prepare(`
    UPDATE stories SET data = ?, updated_at = ? WHERE code = ?
  `).run(JSON.stringify({ character, world, inventory, stations }), updated.updatedAt, code)

  return getStory(code)
}

export function completeStory(code: string): Story | null {
  const existing = getStory(code)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare(`UPDATE stories SET status = 'completed', updated_at = ? WHERE code = ?`).run(now, code)
  return getStory(code)
}

export function listStories(): Story[] {
  const rows = db.prepare('SELECT * FROM stories ORDER BY updated_at DESC').all() as any[]
  return rows.map(deserialize)
}
```

- [ ] **Step 3: Create config module**

Create `lib/config.ts`:
```typescript
import db from './db'
import type { WordLimits } from '@/types/story'

export function getWordLimits(): WordLimits {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get('word_limits') as { value: string }
  return JSON.parse(row.value)
}

export function setWordLimits(limits: WordLimits): void {
  db.prepare('UPDATE config SET value = ? WHERE key = ?').run(JSON.stringify(limits), 'word_limits')
}

export function getAdminPassword(): string {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get('admin_password') as { value: string }
  return JSON.parse(row.value)
}
```

- [ ] **Step 4: Add data/ to .gitignore**

```bash
echo "data/" >> .gitignore
```

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts lib/stories.ts lib/config.ts .gitignore
git commit -m "feat: add SQLite database layer with story CRUD and config"
```

---

## Task 6: API Routes

**Files:**
- Create: `app/api/stories/route.ts`
- Create: `app/api/stories/[code]/route.ts`
- Create: `app/api/admin/stories/route.ts`
- Create: `app/api/admin/stories/[code]/route.ts`
- Create: `app/api/admin/config/route.ts`
- Create: `app/api/export/[code]/route.ts`

- [ ] **Step 1: Create story creation endpoint**

Create `app/api/stories/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { createStory } from '@/lib/stories'

export async function POST() {
  try {
    const story = createStory()
    return NextResponse.json(story, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create story fetch/update endpoint**

Create `app/api/stories/[code]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getStory, updateStory } from '@/lib/stories'

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  const story = getStory(params.code.toUpperCase())
  if (!story) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(story)
}

export async function PATCH(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const body = await req.json()
    const story = updateStory(params.code.toUpperCase(), body)
    if (!story) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(story)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create admin stories list endpoint**

Create `app/api/admin/stories/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { listStories } from '@/lib/stories'
import { getAdminPassword } from '@/lib/config'

function isAuthorized(req: NextRequest): boolean {
  const pw = req.headers.get('x-admin-password')
  return pw === getAdminPassword()
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(listStories())
}
```

- [ ] **Step 4: Create admin complete-story endpoint**

Create `app/api/admin/stories/[code]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { completeStory } from '@/lib/stories'
import { getAdminPassword } from '@/lib/config'

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get('x-admin-password') === getAdminPassword()
}

export async function PATCH(req: NextRequest, { params }: { params: { code: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const story = completeStory(params.code.toUpperCase())
  if (!story) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(story)
}
```

- [ ] **Step 5: Create admin config endpoint**

Create `app/api/admin/config/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getWordLimits, setWordLimits } from '@/lib/config'
import { getAdminPassword } from '@/lib/config'

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get('x-admin-password') === getAdminPassword()
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(getWordLimits())
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  setWordLimits(body)
  return NextResponse.json(getWordLimits())
}
```

- [ ] **Step 6: Create ink export endpoint**

Create `app/api/export/[code]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getStory } from '@/lib/stories'
import { compileToInk } from '@/lib/inkCompiler'

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  const story = getStory(params.code.toUpperCase())
  if (!story) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const ink = compileToInk(story)
  return new NextResponse(ink, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
```

- [ ] **Step 7: Commit**

```bash
git add app/api/
git commit -m "feat: add API routes for stories, admin, and ink export"
```

---

## Task 7: Landing Page

**Files:**
- Create: `components/landing/LandingPage.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create LandingPage component**

Create `components/landing/LandingPage.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleNewStory() {
    setLoading(true)
    const res = await fetch('/api/stories', { method: 'POST' })
    const story = await res.json()
    router.push(`/${story.code}`)
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fullCode = code.join('').toUpperCase()
    if (fullCode.length !== 4) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/stories/${fullCode}`)
    if (!res.ok) {
      setError('Kein Code gefunden. Bitte prüfe deine Eingabe.')
      setLoading(false)
      return
    }
    router.push(`/${fullCode}`)
  }

  function handleCodeChange(index: number, value: string) {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1)
    const next = [...code]
    next[index] = char
    setCode(next)
    if (char && index < 3) {
      document.getElementById(`code-${index + 1}`)?.focus()
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus()
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-12">
          <div className="text-4xl font-bold tracking-tight text-[#1A1A1A] mb-2">
            Story Maker
          </div>
          <div className="text-[#6B7280] text-sm">Schreib deine eigene Geschichte</div>
        </div>

        {/* New Story */}
        <button
          onClick={handleNewStory}
          disabled={loading}
          className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold py-4 px-6 rounded-2xl text-lg transition-colors disabled:opacity-50 active:scale-95 transition-transform"
        >
          Neue Geschichte starten
        </button>

        {/* Divider */}
        <div className="flex items-center my-8 gap-4">
          <div className="flex-1 h-px bg-[#E5E7EB]" />
          <span className="text-[#9CA3AF] text-sm">oder</span>
          <div className="flex-1 h-px bg-[#E5E7EB]" />
        </div>

        {/* Code Entry */}
        <form onSubmit={handleCodeSubmit}>
          <div className="text-center text-sm text-[#6B7280] mb-4">
            Code eingeben
          </div>
          <div className="flex gap-3 justify-center mb-4">
            {code.map((char, i) => (
              <input
                key={i}
                id={`code-${i}`}
                type="text"
                inputMode="text"
                maxLength={1}
                value={char}
                onChange={e => handleCodeChange(i, e.target.value)}
                onKeyDown={e => handleCodeKeyDown(i, e)}
                className="w-14 h-14 text-center text-2xl font-mono font-bold border-2 border-[#E5E7EB] rounded-xl focus:border-[#4F46E5] focus:outline-none uppercase"
              />
            ))}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center mb-4">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || code.join('').length !== 4}
            className="w-full border-2 border-[#4F46E5] text-[#4F46E5] font-semibold py-4 px-6 rounded-2xl text-lg transition-colors disabled:opacity-40 active:scale-95 transition-transform hover:bg-[#EEF2FF]"
          >
            Öffnen
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Update app/page.tsx**

Replace `app/page.tsx`:
```tsx
import LandingPage from '@/components/landing/LandingPage'

export default function Home() {
  return <LandingPage />
}
```

- [ ] **Step 3: Run dev server and verify landing page**

```bash
npm run dev
```
Open `http://localhost:3000` — you should see the landing page with "Neue Geschichte starten" and 4 code input boxes.

- [ ] **Step 4: Commit**

```bash
git add components/landing/ app/page.tsx
git commit -m "feat: add landing page with new story and code entry"
```

---

## Task 8: Character Sheet (Station 0)

**Files:**
- Create: `components/editor/CharacterSheet.tsx`

- [ ] **Step 1: Create CharacterSheet component**

Create `components/editor/CharacterSheet.tsx`:
```tsx
'use client'

import type { Character, World, Strength } from '@/types/story'

interface Props {
  character: Character
  world: World
  onChange: (patch: { character?: Partial<Character>; world?: Partial<World> }) => void
  onContinue: () => void
}

const STRENGTHS: Strength[] = ['Mutig', 'Schlau', 'Einfühlsam', 'Stark']

export default function CharacterSheet({ character, world, onChange, onContinue }: Props) {
  const canContinue = character.name.trim() && character.weakness.trim() && character.goal.trim() && world.description.trim()

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      {/* World section */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-4">
          Deine Welt
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Wie sieht die Welt aus?
            </label>
            <textarea
              rows={3}
              value={world.description}
              onChange={e => onChange({ world: { description: e.target.value } })}
              placeholder="Eine Stadt voller Geheimnisse, ein Wald ohne Licht..."
              className="w-full border border-[#E5E7EB] rounded-xl p-3 text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:outline-none focus:border-[#F59E0B] text-base leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Was ist das größte Problem dieser Welt?
            </label>
            <textarea
              rows={2}
              value={world.problem}
              onChange={e => onChange({ world: { problem: e.target.value } })}
              placeholder="Alle Bücher verschwinden, niemand darf träumen..."
              className="w-full border border-[#E5E7EB] rounded-xl p-3 text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:outline-none focus:border-[#F59E0B] text-base leading-relaxed"
            />
          </div>
        </div>
      </section>

      {/* Character section */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-4">
          Deine Figur
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Name</label>
            <input
              type="text"
              value={character.name}
              onChange={e => onChange({ character: { name: e.target.value } })}
              placeholder="Wie heißt deine Heldin / dein Held?"
              className="w-full border border-[#E5E7EB] rounded-xl p-3 text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:outline-none focus:border-[#F59E0B] text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">Stärke</label>
            <div className="grid grid-cols-2 gap-2">
              {STRENGTHS.map(s => (
                <button
                  key={s}
                  onClick={() => onChange({ character: { strength: s } })}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-colors ${
                    character.strength === s
                      ? 'border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]'
                      : 'border-[#E5E7EB] text-[#374151] hover:border-[#F59E0B]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Schwäche</label>
            <input
              type="text"
              value={character.weakness}
              onChange={e => onChange({ character: { weakness: e.target.value } })}
              placeholder="Ungeduldig, leichtgläubig, vergesslich..."
              className="w-full border border-[#E5E7EB] rounded-xl p-3 text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:outline-none focus:border-[#F59E0B] text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Ziel</label>
            <input
              type="text"
              value={character.goal}
              onChange={e => onChange({ character: { goal: e.target.value } })}
              placeholder="Was will deine Figur erreichen?"
              className="w-full border border-[#E5E7EB] rounded-xl p-3 text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:outline-none focus:border-[#F59E0B] text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Geheimnis <span className="text-[#9CA3AF] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={character.secret}
              onChange={e => onChange({ character: { secret: e.target.value } })}
              placeholder="Etwas, das nur du weißt..."
              className="w-full border border-[#E5E7EB] rounded-xl p-3 text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:outline-none focus:border-[#F59E0B] text-base"
            />
          </div>
        </div>
      </section>

      <button
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-white font-semibold py-4 rounded-2xl text-lg transition-colors active:scale-95"
      >
        Geschichte beginnen →
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/editor/CharacterSheet.tsx
git commit -m "feat: add CharacterSheet component for station 0"
```

---

## Task 9: Station Editor Components

**Files:**
- Create: `components/editor/WordCounter.tsx`
- Create: `components/editor/ChoiceCard.tsx`
- Create: `components/editor/StationEditor.tsx`

- [ ] **Step 1: Create WordCounter**

Create `components/editor/WordCounter.tsx`:
```tsx
'use client'

import { countWords, isNearLimit, isOverLimit } from '@/lib/wordCount'

interface Props {
  text: string
  limit: number
}

export default function WordCounter({ text, limit }: Props) {
  const count = countWords(text)
  const near = isNearLimit(count, limit)
  const over = isOverLimit(count, limit)

  return (
    <div className="space-y-1">
      <div className={`flex items-center justify-between text-sm ${over ? 'text-red-500' : near ? 'text-[#92400E]' : 'text-[#9CA3AF]'}`}>
        <span>{count} / {limit} Wörter</span>
        {over && <span className="font-medium">Zu lang! Kürze deinen Text.</span>}
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : near ? 'bg-[#F59E0B]' : 'bg-[#4F46E5]'}`}
          style={{ width: `${Math.min((count / limit) * 100, 100)}%` }}
        />
      </div>
      {near && !over && (
        <div className="text-xs text-[#92400E] bg-[#FEF3C7] rounded-lg px-3 py-2 mt-2 transition-all">
          💡 Arbeite jetzt auf eine Entscheidung hin!
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create ChoiceCard**

Create `components/editor/ChoiceCard.tsx`:
```tsx
'use client'

import type { Choice } from '@/types/story'
import WordCounter from './WordCounter'

interface Props {
  choice: Choice
  index: number
  consequenceLimit: number
  onChange: (patch: Partial<Choice>) => void
  onRemove: () => void
}

export default function ChoiceCard({ choice, index, consequenceLimit, onChange, onRemove }: Props) {
  return (
    <div className="border border-[#E5E7EB] rounded-2xl p-4 space-y-3 bg-[#F9F9F9] animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">
          Entscheidung {index + 1}
        </span>
        <button
          onClick={onRemove}
          className="text-[#D1D5DB] hover:text-red-400 transition-colors text-lg leading-none"
          aria-label="Entscheidung entfernen"
        >
          ×
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1">
          Was tut dein Charakter?
        </label>
        <input
          type="text"
          value={choice.label}
          onChange={e => onChange({ label: e.target.value })}
          placeholder="Sie öffnet die Tür..."
          className="w-full border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:outline-none focus:border-[#F59E0B] bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1">
          Was passiert dann?
        </label>
        <textarea
          rows={3}
          value={choice.consequence}
          onChange={e => onChange({ consequence: e.target.value })}
          placeholder="Hinter der Tür liegt ein dunkler Korridor..."
          className="w-full border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:outline-none focus:border-[#F59E0B] leading-relaxed bg-white"
        />
        <div className="mt-2">
          <WordCounter text={choice.consequence} limit={consequenceLimit} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create StationEditor**

Create `components/editor/StationEditor.tsx`:
```tsx
'use client'

import { useState } from 'react'
import type { Station, Choice } from '@/types/story'
import { STATION_NAMES, STATION_TIPS } from '@/types/story'
import { countWords } from '@/lib/wordCount'
import WordCounter from './WordCounter'
import ChoiceCard from './ChoiceCard'

interface Props {
  station: Station
  wordLimit: number
  consequenceLimit: number
  onChange: (updated: Station) => void
  onNext: () => void
  isLast: boolean
}

export default function StationEditor({ station, wordLimit, consequenceLimit, onChange, onNext, isLast }: Props) {
  const [showMoreHelp, setShowMoreHelp] = useState(false)
  const tip = STATION_TIPS[station.id]
  const wordCount = countWords(station.text)
  const canAddChoice = wordCount >= 60 && station.choices.length < 3
  const canContinue = wordCount > 0 && station.choices.length >= 2

  function addChoice() {
    onChange({
      ...station,
      choices: [...station.choices, { label: '', consequence: '' }],
    })
  }

  function updateChoice(index: number, patch: Partial<Choice>) {
    const choices = station.choices.map((c, i) => i === index ? { ...c, ...patch } : c)
    onChange({ ...station, choices })
  }

  function removeChoice(index: number) {
    onChange({ ...station, choices: station.choices.filter((_, i) => i !== index) })
  }

  function handleNext() {
    onChange({ ...station, completed: true })
    onNext()
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Station header */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
          Station {station.id} von 6
        </div>
        <h2 className="text-2xl font-bold text-[#1A1A1A]">
          {STATION_NAMES[station.id]}
        </h2>
      </div>

      {/* Tip */}
      <div className="bg-[#F9F9F9] rounded-2xl p-4">
        <p className="text-[#374151] text-sm leading-relaxed">
          💡 {showMoreHelp ? tip.long : tip.short}
        </p>
        <button
          onClick={() => setShowMoreHelp(v => !v)}
          className="text-[#4F46E5] text-xs font-medium mt-2"
        >
          {showMoreHelp ? 'Weniger anzeigen ↑' : 'Mehr Hilfe ↓'}
        </button>
      </div>

      {/* Main text */}
      <div>
        <textarea
          rows={8}
          value={station.text}
          onChange={e => onChange({ ...station, text: e.target.value })}
          placeholder="Schreib hier deine Geschichte weiter..."
          className="w-full border border-[#E5E7EB] rounded-2xl p-4 text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:outline-none focus:border-[#F59E0B] text-base leading-relaxed"
        />
        <div className="mt-2">
          <WordCounter text={station.text} limit={wordLimit} />
        </div>
      </div>

      {/* Choices */}
      <div className="space-y-3">
        {station.choices.map((choice, i) => (
          <ChoiceCard
            key={i}
            choice={choice}
            index={i}
            consequenceLimit={consequenceLimit}
            onChange={patch => updateChoice(i, patch)}
            onRemove={() => removeChoice(i)}
          />
        ))}

        {canAddChoice && (
          <button
            onClick={addChoice}
            className="w-full border-2 border-dashed border-[#E5E7EB] rounded-2xl py-4 text-[#9CA3AF] text-sm font-medium hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors"
          >
            + Entscheidung hinzufügen
          </button>
        )}

        {wordCount < 60 && station.choices.length === 0 && (
          <p className="text-center text-xs text-[#D1D5DB] pt-2">
            Schreib mindestens 60 Wörter, um Entscheidungen hinzuzufügen.
          </p>
        )}
      </div>

      {/* Next button */}
      {!isLast ? (
        <button
          onClick={handleNext}
          disabled={!canContinue}
          className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-white font-semibold py-4 rounded-2xl text-lg transition-colors active:scale-95"
        >
          Weiter →
        </button>
      ) : (
        <button
          onClick={handleNext}
          disabled={!canContinue}
          className="w-full bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-40 text-white font-semibold py-4 rounded-2xl text-lg transition-colors active:scale-95"
        >
          Geschichte abschließen ✓
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/editor/WordCounter.tsx components/editor/ChoiceCard.tsx components/editor/StationEditor.tsx
git commit -m "feat: add WordCounter, ChoiceCard, and StationEditor components"
```

---

## Task 10: Story Editor Shell

**Files:**
- Create: `components/editor/SaveIndicator.tsx`
- Create: `components/editor/CharacterCard.tsx`
- Create: `components/editor/InventoryList.tsx`
- Create: `components/editor/StationProgress.tsx`
- Create: `components/editor/StoryEditor.tsx`
- Create: `app/[code]/page.tsx`

- [ ] **Step 1: Create SaveIndicator**

Create `components/editor/SaveIndicator.tsx`:
```tsx
'use client'

interface Props {
  status: 'saved' | 'saving' | 'error'
}

export default function SaveIndicator({ status }: Props) {
  return (
    <span className={`text-xs font-medium transition-all ${
      status === 'saved' ? 'text-green-500' :
      status === 'saving' ? 'text-[#9CA3AF]' :
      'text-red-400'
    }`}>
      {status === 'saved' && '✓ Gespeichert'}
      {status === 'saving' && 'Speichert…'}
      {status === 'error' && '✗ Fehler'}
    </span>
  )
}
```

- [ ] **Step 2: Create InventoryList**

Create `components/editor/InventoryList.tsx`:
```tsx
'use client'

import { useState } from 'react'

interface Props {
  items: string[]
  onChange: (items: string[]) => void
}

export default function InventoryList({ items, onChange }: Props) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)

  function addItem() {
    const trimmed = input.trim()
    if (!trimmed || items.includes(trimmed)) return
    onChange([...items, trimmed])
    setInput('')
    setOpen(false)
  }

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">
        🎒 Inventar
      </div>
      {items.length === 0 && (
        <p className="text-xs text-[#D1D5DB] mb-2">Noch nichts gefunden.</p>
      )}
      <ul className="space-y-1 mb-2">
        {items.map(item => (
          <li key={item} className="flex items-center gap-1 text-sm text-[#374151]">
            <span className="text-[#F59E0B]">•</span> {item}
            <button
              onClick={() => onChange(items.filter(i => i !== item))}
              className="ml-auto text-[#E5E7EB] hover:text-red-400 text-xs"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <div className="flex gap-1">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Gegenstand..."
            className="flex-1 border border-[#E5E7EB] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#F59E0B]"
            autoFocus
          />
          <button onClick={addItem} className="text-[#F59E0B] text-xs font-semibold px-2">
            +
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-[#4F46E5] font-medium"
        >
          + Gegenstand gefunden
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create CharacterCard**

Create `components/editor/CharacterCard.tsx`:
```tsx
'use client'

import type { Character } from '@/types/story'
import InventoryList from './InventoryList'

interface Props {
  character: Character
  inventory: string[]
  onInventoryChange: (items: string[]) => void
}

export default function CharacterCard({ character, inventory, onInventoryChange }: Props) {
  return (
    <div className="h-full bg-[#F9F9F9] border-r border-[#E5E7EB] p-4 space-y-4 overflow-y-auto">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">
          Figur
        </div>
        <div className="font-bold text-[#1A1A1A] text-lg leading-tight">
          {character.name || '—'}
        </div>
        <div className="text-sm text-[#4F46E5] font-medium mt-1">
          {character.strength}
        </div>
        {character.goal && (
          <div className="text-xs text-[#6B7280] mt-2 leading-relaxed">
            🎯 {character.goal}
          </div>
        )}
      </div>

      <div className="border-t border-[#E5E7EB] pt-4">
        <InventoryList items={inventory} onChange={onInventoryChange} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create StationProgress**

Create `components/editor/StationProgress.tsx`:
```tsx
'use client'

import type { Station } from '@/types/story'
import { STATION_NAMES } from '@/types/story'

interface Props {
  stations: Station[]
  currentStation: number  // 0 = character sheet
  onSelect: (id: number) => void
}

export default function StationProgress({ stations, currentStation, onSelect }: Props) {
  return (
    <div className="h-full bg-[#F9F9F9] border-l border-[#E5E7EB] p-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-4">
        Verlauf
      </div>
      <div className="space-y-3">
        {/* Station 0: Character */}
        <button
          onClick={() => onSelect(0)}
          className={`flex items-center gap-2 w-full text-left ${currentStation === 0 ? 'text-[#F59E0B]' : 'text-[#9CA3AF]'}`}
        >
          <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
            currentStation === 0 ? 'border-[#F59E0B] bg-[#F59E0B]' : 'border-[#4F46E5] bg-[#4F46E5]'
          }`} />
          <span className="text-xs font-medium">Figur & Welt</span>
        </button>

        {stations.map(station => {
          const isActive = currentStation === station.id
          const isDone = station.completed
          return (
            <button
              key={station.id}
              onClick={() => isDone && onSelect(station.id)}
              disabled={!isDone && currentStation !== station.id}
              className={`flex items-center gap-2 w-full text-left ${
                isActive ? 'text-[#F59E0B]' :
                isDone ? 'text-[#374151] cursor-pointer' :
                'text-[#D1D5DB] cursor-default'
              }`}
            >
              <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                isActive ? 'border-[#F59E0B] bg-[#F59E0B]' :
                isDone ? 'border-[#4F46E5] bg-[#4F46E5]' :
                'border-[#D1D5DB]'
              }`} />
              <span className="text-xs font-medium hidden lg:block">
                {STATION_NAMES[station.id]}
              </span>
              <span className="text-xs font-medium lg:hidden">{station.id}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create StoryEditor shell**

Create `components/editor/StoryEditor.tsx`:
```tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Story, WordLimits } from '@/types/story'
import CharacterCard from './CharacterCard'
import StationProgress from './StationProgress'
import CharacterSheet from './CharacterSheet'
import StationEditor from './StationEditor'
import SaveIndicator from './SaveIndicator'

interface Props {
  initial: Story
  wordLimits: WordLimits
}

type SaveStatus = 'saved' | 'saving' | 'error'

export default function StoryEditor({ initial, wordLimits }: Props) {
  const [story, setStory] = useState<Story>(initial)
  const [currentStation, setCurrentStation] = useState<number>(
    initial.stations.find(s => !s.completed)?.id ?? 0
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  const save = useCallback(async (data: Partial<Story>) => {
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/stories/${initial.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }, [initial.code])

  function scheduleSave(data: Partial<Story>) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(data), 500)
  }

  function handleCharacterWorldChange(patch: { character?: Partial<Story['character']>; world?: Partial<Story['world']> }) {
    const updated = {
      ...story,
      character: { ...story.character, ...patch.character },
      world: { ...story.world, ...patch.world },
    }
    setStory(updated)
    scheduleSave({ character: updated.character, world: updated.world })
  }

  function handleInventoryChange(inventory: string[]) {
    setStory(s => ({ ...s, inventory }))
    scheduleSave({ inventory })
  }

  function handleStationChange(updated: Story['stations'][0]) {
    const stations = story.stations.map(s => s.id === updated.id ? updated : s)
    setStory(s => ({ ...s, stations }))
    scheduleSave({ stations })
  }

  function handleNext() {
    const next = story.stations.find(s => s.id > currentStation && !s.completed)
    if (next) setCurrentStation(next.id)
  }

  const stationWordLimit = (id: number): number => {
    return wordLimits[`station${id}` as keyof WordLimits] as number
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] flex-shrink-0">
        <span className="font-bold text-[#1A1A1A] text-lg tracking-tight">Story Maker</span>
        <div className="flex items-center gap-4">
          <SaveIndicator status={saveStatus} />
          <span className="font-mono font-bold text-[#4F46E5] text-xl tracking-widest">
            {initial.code}
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: character card */}
        <div className="w-36 lg:w-48 flex-shrink-0 hidden md:block">
          <CharacterCard
            character={story.character}
            inventory={story.inventory}
            onInventoryChange={handleInventoryChange}
          />
        </div>

        {/* Center: editor */}
        <div className="flex-1 overflow-y-auto">
          {currentStation === 0 ? (
            <CharacterSheet
              character={story.character}
              world={story.world}
              onChange={handleCharacterWorldChange}
              onContinue={() => setCurrentStation(1)}
            />
          ) : (
            (() => {
              const station = story.stations.find(s => s.id === currentStation)
              if (!station) return null
              return (
                <StationEditor
                  station={station}
                  wordLimit={stationWordLimit(station.id)}
                  consequenceLimit={wordLimits.consequence}
                  onChange={handleStationChange}
                  onNext={handleNext}
                  isLast={station.id === 6}
                />
              )
            })()
          )}
        </div>

        {/* Right: progress */}
        <div className="w-16 lg:w-44 flex-shrink-0">
          <StationProgress
            stations={story.stations}
            currentStation={currentStation}
            onSelect={setCurrentStation}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create [code] page**

Create `app/[code]/page.tsx`:
```tsx
import { notFound, redirect } from 'next/navigation'
import { getStory } from '@/lib/stories'
import { getWordLimits } from '@/lib/config'
import StoryEditor from '@/components/editor/StoryEditor'

interface Props {
  params: { code: string }
}

export default async function StoryPage({ params }: Props) {
  const code = params.code.toUpperCase()
  const story = getStory(code)

  if (!story) return notFound()
  if (story.status === 'completed') redirect(`/${code}/view`)

  const wordLimits = getWordLimits()

  return <StoryEditor initial={story} wordLimits={wordLimits} />
}
```

- [ ] **Step 7: Commit**

```bash
git add components/editor/ app/[code]/
git commit -m "feat: add full story editor shell with autosave and navigation"
```

---

## Task 11: Completed Story View & PDF Export

**Files:**
- Create: `components/view/StoryView.tsx`
- Create: `components/view/StoryDocument.tsx`
- Create: `app/[code]/view/page.tsx`

- [ ] **Step 1: Create StoryView**

Create `components/view/StoryView.tsx`:
```tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { Story } from '@/types/story'
import { STATION_NAMES } from '@/types/story'

const PDFDownloadButton = dynamic(() => import('./StoryDocument'), { ssr: false })

interface Props {
  story: Story
}

export default function StoryView({ story }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">
            {story.code}
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">
            {story.character.name ? `${story.character.name}s Abenteuer` : 'Meine Geschichte'}
          </h1>
        </div>

        {/* World */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">
            Die Welt
          </h2>
          <p className="text-[#374151] leading-relaxed">{story.world.description}</p>
          {story.world.problem && (
            <p className="text-[#374151] leading-relaxed mt-2">{story.world.problem}</p>
          )}
        </section>

        {/* Character */}
        <section className="mb-10 bg-[#F9F9F9] rounded-2xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">
            Die Figur
          </h2>
          <div className="font-bold text-xl text-[#1A1A1A] mb-1">{story.character.name}</div>
          <div className="text-[#4F46E5] text-sm font-medium mb-2">{story.character.strength}</div>
          {story.character.weakness && <p className="text-sm text-[#6B7280]">Schwäche: {story.character.weakness}</p>}
          {story.character.goal && <p className="text-sm text-[#6B7280]">Ziel: {story.character.goal}</p>}
          {story.inventory.length > 0 && (
            <div className="mt-3">
              <span className="text-sm text-[#9CA3AF]">🎒 </span>
              <span className="text-sm text-[#374151]">{story.inventory.join(', ')}</span>
            </div>
          )}
        </section>

        {/* Stations */}
        <div className="space-y-10">
          {story.stations.filter(s => s.text).map(station => (
            <section key={station.id}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">
                {STATION_NAMES[station.id]}
              </h2>
              <p className="text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">{station.text}</p>

              {station.choices.length > 0 && (
                <div className="mt-4 space-y-3 pl-4 border-l-2 border-[#F59E0B]">
                  {station.choices.map((choice, i) => (
                    <div key={i}>
                      <div className="text-sm font-semibold text-[#92400E]">
                        ▸ {choice.label}
                      </div>
                      {choice.consequence && (
                        <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">
                          {choice.consequence}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* PDF Export */}
        <div className="mt-16 text-center">
          <PDFDownloadButton story={story} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create StoryDocument (react-pdf)**

Create `components/view/StoryDocument.tsx`:
```tsx
'use client'

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'
import type { Story } from '@/types/story'
import { STATION_NAMES } from '@/types/story'

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 6, color: '#1A1A1A' },
  code: { fontSize: 9, color: '#9CA3AF', marginBottom: 24, letterSpacing: 2 },
  sectionLabel: { fontSize: 8, color: '#9CA3AF', letterSpacing: 2, marginBottom: 6, marginTop: 20 },
  body: { fontSize: 11, color: '#374151', lineHeight: 1.6 },
  characterName: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 2 },
  characterDetail: { fontSize: 10, color: '#6B7280', marginBottom: 2 },
  choiceLabel: { fontSize: 10, fontWeight: 'bold', color: '#92400E', marginTop: 8, marginLeft: 16 },
  choiceText: { fontSize: 10, color: '#6B7280', marginLeft: 16, lineHeight: 1.5 },
  divider: { borderBottom: 1, borderColor: '#E5E7EB', marginVertical: 12 },
})

function StoryPDF({ story }: { story: Story }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.code}>{story.code}</Text>
        <Text style={styles.title}>
          {story.character.name ? `${story.character.name}s Abenteuer` : 'Meine Geschichte'}
        </Text>
        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>DIE WELT</Text>
        <Text style={styles.body}>{story.world.description}</Text>
        {story.world.problem ? <Text style={styles.body}>{story.world.problem}</Text> : null}

        <Text style={styles.sectionLabel}>DIE FIGUR</Text>
        <Text style={styles.characterName}>{story.character.name}</Text>
        <Text style={styles.characterDetail}>{story.character.strength}</Text>
        {story.character.weakness ? <Text style={styles.characterDetail}>Schwäche: {story.character.weakness}</Text> : null}
        {story.character.goal ? <Text style={styles.characterDetail}>Ziel: {story.character.goal}</Text> : null}
        {story.inventory.length > 0 ? (
          <Text style={styles.characterDetail}>🎒 {story.inventory.join(', ')}</Text>
        ) : null}

        {story.stations.filter(s => s.text).map(station => (
          <View key={station.id}>
            <Text style={styles.sectionLabel}>{STATION_NAMES[station.id].toUpperCase()}</Text>
            <Text style={styles.body}>{station.text}</Text>
            {station.choices.map((choice, i) => (
              <View key={i}>
                <Text style={styles.choiceLabel}>▸ {choice.label}</Text>
                {choice.consequence ? <Text style={styles.choiceText}>{choice.consequence}</Text> : null}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  )
}

export default function PDFDownloadButton({ story }: { story: Story }) {
  const filename = `${story.code}-${story.character.name || 'Geschichte'}.pdf`.replace(/\s+/g, '-')
  return (
    <PDFDownloadLink document={<StoryPDF story={story} />} fileName={filename}>
      {({ loading }) => (
        <button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-colors active:scale-95">
          {loading ? 'PDF wird erstellt…' : '📄 Als PDF exportieren'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
```

- [ ] **Step 3: Create view page**

Create `app/[code]/view/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { getStory } from '@/lib/stories'
import StoryView from '@/components/view/StoryView'

interface Props {
  params: { code: string }
}

export default async function ViewPage({ params }: Props) {
  const story = getStory(params.code.toUpperCase())
  if (!story || story.status !== 'completed') return notFound()
  return <StoryView story={story} />
}
```

- [ ] **Step 4: Commit**

```bash
git add components/view/ app/[code]/view/
git commit -m "feat: add completed story view with PDF export"
```

---

## Task 12: Admin Board

**Files:**
- Create: `components/admin/AdminBoard.tsx`
- Create: `components/admin/ConfigPanel.tsx`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Create AdminBoard component**

Create `components/admin/AdminBoard.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import type { Story } from '@/types/story'
import { useRouter } from 'next/navigation'

interface Props {
  password: string
}

export default function AdminBoard({ password }: Props) {
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchStories() {
    const res = await fetch('/api/admin/stories', {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) setStories(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchStories() }, [])

  async function complete(code: string) {
    await fetch(`/api/admin/stories/${code}`, {
      method: 'PATCH',
      headers: { 'x-admin-password': password },
    })
    fetchStories()
  }

  const progress = (story: Story) => story.stations.filter(s => s.completed).length

  if (loading) return <div className="text-center py-12 text-[#9CA3AF]">Lädt…</div>

  return (
    <div>
      <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Geschichten</h2>
      {stories.length === 0 && (
        <p className="text-[#9CA3AF] text-sm">Noch keine Geschichten vorhanden.</p>
      )}
      <div className="space-y-2">
        {stories.map(story => (
          <div
            key={story.code}
            className="flex items-center gap-4 bg-[#F9F9F9] rounded-2xl px-4 py-3"
          >
            <span className="font-mono font-bold text-[#4F46E5] text-lg w-16">
              {story.code}
            </span>
            <span className="flex-1 font-medium text-[#1A1A1A]">
              {story.character.name || '(kein Name)'}
            </span>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5,6].map(i => (
                <span key={i} className={`w-2 h-2 rounded-full ${
                  i <= progress(story) ? 'bg-[#4F46E5]' : 'bg-[#E5E7EB]'
                }`} />
              ))}
              <span className="text-xs text-[#9CA3AF] ml-1">{progress(story)}/6</span>
            </div>
            <span className="text-xs text-[#9CA3AF] w-28 text-right">
              {new Date(story.updatedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={() => router.push(`/${story.code}`)}
              className="text-xs text-[#4F46E5] font-medium px-2 py-1 rounded-lg hover:bg-[#EEF2FF]"
            >
              Öffnen
            </button>
            {story.status === 'active' ? (
              <button
                onClick={() => complete(story.code)}
                className="text-xs text-white bg-[#4F46E5] font-medium px-3 py-1.5 rounded-lg hover:bg-[#4338CA]"
              >
                Abschließen ✓
              </button>
            ) : (
              <span className="text-xs text-green-500 font-medium px-3 py-1.5">
                ✓ Fertig
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ConfigPanel**

Create `components/admin/ConfigPanel.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import type { WordLimits } from '@/types/story'
import { STATION_NAMES } from '@/types/story'

interface Props {
  password: string
}

export default function ConfigPanel({ password }: Props) {
  const [limits, setLimits] = useState<WordLimits | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/config', { headers: { 'x-admin-password': password } })
      .then(r => r.json()).then(setLimits)
  }, [])

  async function save() {
    await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(limits),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!limits) return null

  const stationKeys = [1,2,3,4,5,6] as const

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Wort-Limits anpassen</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {stationKeys.map(i => {
          const key = `station${i}` as keyof WordLimits
          return (
            <div key={i} className="flex items-center gap-3 bg-[#F9F9F9] rounded-xl px-4 py-3">
              <span className="text-sm text-[#374151] flex-1">{STATION_NAMES[i]}</span>
              <input
                type="number"
                min={30}
                max={500}
                value={limits[key]}
                onChange={e => setLimits({ ...limits, [key]: Number(e.target.value) })}
                className="w-16 border border-[#E5E7EB] rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          )
        })}
        <div className="flex items-center gap-3 bg-[#F9F9F9] rounded-xl px-4 py-3">
          <span className="text-sm text-[#374151] flex-1">Konsequenzen</span>
          <input
            type="number"
            min={20}
            max={200}
            value={limits.consequence}
            onChange={e => setLimits({ ...limits, consequence: Number(e.target.value) })}
            className="w-16 border border-[#E5E7EB] rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-[#F59E0B]"
          />
        </div>
      </div>
      <button
        onClick={save}
        className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold py-3 px-6 rounded-xl transition-colors"
      >
        {saved ? '✓ Gespeichert!' : 'Speichern & Anwenden'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create admin layout (password gate)**

Create `app/admin/layout.tsx`:
```tsx
'use client'

import { useState } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState(false)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/stories', {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) {
      sessionStorage.setItem('admin_pw', password)
      setAuthenticated(true)
    } else {
      setError(true)
    }
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <form onSubmit={login} className="w-80 space-y-4">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Admin</h1>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
            placeholder="Passwort"
            className="w-full border border-[#E5E7EB] rounded-xl p-3 focus:outline-none focus:border-[#4F46E5]"
          />
          {error && <p className="text-red-500 text-sm">Falsches Passwort.</p>}
          <button className="w-full bg-[#4F46E5] text-white font-semibold py-3 rounded-xl">
            Einloggen
          </button>
        </form>
      </main>
    )
  }

  return <>{children}</>
}
```

- [ ] **Step 4: Create admin page**

Create `app/admin/page.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import AdminBoard from '@/components/admin/AdminBoard'
import ConfigPanel from '@/components/admin/ConfigPanel'

export default function AdminPage() {
  const [password, setPassword] = useState('')

  useEffect(() => {
    setPassword(sessionStorage.getItem('admin_pw') ?? '')
  }, [])

  if (!password) return null

  return (
    <main className="min-h-screen bg-white px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">🎬 Workshop Admin</h1>
        <button
          onClick={() => { sessionStorage.removeItem('admin_pw'); window.location.href = '/admin' }}
          className="text-sm text-[#9CA3AF] hover:text-[#6B7280]"
        >
          Abmelden
        </button>
      </div>
      <AdminBoard password={password} />
      <ConfigPanel password={password} />
    </main>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/admin/ app/admin/
git commit -m "feat: add admin board with story management and word limit config"
```

---

## Task 13: Final Integration & Pi Setup

**Files:**
- Create: `README.md` (setup instructions)

- [ ] **Step 1: Run all tests**

```bash
npx jest
```
Expected: All tests PASS.

- [ ] **Step 2: Run dev server and verify full flow**

```bash
npm run dev
```

Manual check:
1. Open `http://localhost:3000`
2. Click "Neue Geschichte starten" → redirected to `/{CODE}`
3. Fill in character sheet → click "Geschichte beginnen"
4. Write text in Station 1 → word counter appears
5. Reach 60 words → "Entscheidung hinzufügen" appears
6. Add 2 choices → "Weiter" button activates
7. Complete all stations
8. Open `/admin` → enter password `workshop2024`
9. See story in list → click "Abschließen"
10. Open `/{CODE}` → redirected to `/{CODE}/view`
11. See formatted story → click PDF export → PDF downloads

- [ ] **Step 3: Build for production**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 4: Create README with Pi setup**

Create `README.md`:
```markdown
# Story Maker — Setup auf dem Raspberry Pi

## Voraussetzungen
- Node.js 20+ auf dem Pi installiert
- Repository geklont

## Installation

\```bash
npm install
npm run build
\```

## Starten

\```bash
npm run start
\```

Die App läuft auf Port 3000. Im lokalen Netzwerk erreichbar unter:
`http://<PI-IP-ADRESSE>:3000`

Die IP-Adresse des Pi findest du mit: `hostname -I`

## Admin-Zugang

URL: `http://<PI-IP-ADRESSE>:3000/admin`
Standard-Passwort: `workshop2024`

## Daten

Alle Geschichten werden in `data/stories.db` gespeichert (SQLite).
Die Datei wird automatisch erstellt.

## Autostart (optional)

Um die App beim Pi-Start automatisch zu starten:

\```bash
# /etc/systemd/system/storymaker.service
[Unit]
Description=Story Maker Workshop App
After=network.target

[Service]
WorkingDirectory=/home/pi/storymaker
ExecStart=/usr/bin/npm run start
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
\```

\```bash
sudo systemctl enable storymaker
sudo systemctl start storymaker
\```
```

- [ ] **Step 5: Final commit**

```bash
git add README.md
git commit -m "feat: add Pi setup instructions and finalize integration"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Landing page (neu + Code-Eingabe)
- ✅ 4-stelliger Code
- ✅ Charakter-Sheet (Station 0, frei)
- ✅ 6 Heldenreise-Stationen mit progressiven Limits
- ✅ Diamant-Prinzip (Choice → Konsequenz → Gather)
- ✅ Min. 60 Wörter vor Choice-Freischaltung
- ✅ 80%-Warnmeldung
- ✅ Inventar-System
- ✅ Sticky Charakter-Karte
- ✅ Stationsfortschritt rechts
- ✅ Auto-Save (debounced 500ms)
- ✅ Story-Code permanent im Header
- ✅ Admin-Board mit Passwort
- ✅ Wort-Limits konfigurierbar (sofort wirksam)
- ✅ "Abschließen"-Button pro Geschichte
- ✅ Completed-View (Nur-Lese)
- ✅ PDF-Export
- ✅ Ink-Compiler (unsichtbar)
- ✅ SQLite-Persistenz
- ✅ iPad-optimiert (Touch, Viewport)
- ✅ Amber + Indigo Farbschema
- ✅ Pi-Hosting-Anleitung

**Offene Punkte (bewusst zurückgestellt):**
- Flowchart-Visualisierung → späteres Feature
- Ink-Code-Ansicht für Lehrer → späteres Feature
