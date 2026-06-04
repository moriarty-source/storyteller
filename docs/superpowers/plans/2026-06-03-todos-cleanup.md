# Todos Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Commit the existing Vercel fixes, repair the font preload warning, and fix the broken E2E Playwright test setup.

**Architecture:** Three independent tasks in order of effort: (1) straight git commit of 9 already-working changed files, (2) one-line layout fix to use `inter.className` instead of `inter.variable` so the Inter font is actually consumed, (3) restructure Playwright so it lives at the project root and Jest can no longer accidentally pick up its spec files.

**Tech Stack:** Next.js 16 App Router, next/font/google, Playwright 1.60, Jest 30 + ts-jest, TypeScript 6

---

## File Map

| File | Change |
|---|---|
| `src/app/layout.tsx` | `inter.variable` → `inter.className` |
| `playwright.config.ts` (new at root) | Move + fix testDir |
| `e2e/playwright.config.ts` | Delete |
| `jest.config.ts` | Add `testPathIgnorePatterns` to exclude `e2e/` |
| `package.json` | Add `"test:e2e"` script |

---

### Task 1: Commit the existing Vercel fixes

**Files:**
- Modify: `deploy.ps1`, `src/app/api/admin/stories/route.ts`, `src/app/api/stories/route.ts`, `src/lib/adapters/defaults.ts`, `src/lib/adapters/postgres.ts`, `src/lib/adapters/sqlite.ts`, `src/lib/config.ts`, `src/lib/db-adapter.ts`, `src/lib/stories.ts`

- [x] **Step 1: Stage all modified files**

```bash
git add deploy.ps1 \
  src/app/api/admin/stories/route.ts \
  src/app/api/stories/route.ts \
  src/lib/adapters/defaults.ts \
  src/lib/adapters/postgres.ts \
  src/lib/adapters/sqlite.ts \
  src/lib/config.ts \
  src/lib/db-adapter.ts \
  src/lib/stories.ts
```

- [x] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
fix: resolve 500 errors on Vercel — ESM adapter loading and admin password JSON parse

- getAdapter() now uses async ESM import() for reliable serverless bundling
- All callers updated to await getAdapter()
- API routes wrapped in try/catch for clean JSON error responses
- getAdminPassword() in both adapters now falls back to raw text on JSON.parse failure
- deploy.ps1 updated

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

- [x] **Step 3: Verify commit**

```bash
git log --oneline -3
```
Expected: top commit shows the fix message above.

---

### Task 2: Fix the Inter font preload warning

**Root cause:** `inter.variable` injects a CSS custom property `--font-inter` but does not apply `font-family` to any element. The browser preloads the woff2 file and then detects it was never used, producing the warning. `inter.className` applies `font-family` directly on the element — no variable, no unused-preload.

**Files:**
- Modify: `src/app/layout.tsx`

- [x] **Step 1: Update layout to use `inter.className`**

Open `src/app/layout.tsx`. Change:

```tsx
// Before
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// ...
<body className={`${inter.variable} antialiased`}>
```

To:

```tsx
// After
const inter = Inter({
  subsets: ['latin'],
});

// ...
<body className={`${inter.className} antialiased`}>
```

- [x] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully` — no font-related warnings in the build output.

- [x] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "$(cat <<'EOF'
fix: eliminate Inter font preload warning by using className instead of CSS variable

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Fix the E2E Playwright setup

**Root cause (two issues):**
1. `e2e/playwright.config.ts` sets `testDir: './e2e'`, which from inside `e2e/` resolves to `e2e/e2e/` (doesn't exist). Config must live at the project root.
2. Jest picks up `e2e/*.spec.ts` and tries to run them with ts-jest. `@playwright/test`'s `test` class fails to initialise in the Jest/jsdom environment, producing `TypeError: Class extends value undefined is not a constructor or null`.

**Fix:** Move config to root, update `testDir`, add Jest exclusion, add npm script.

**Files:**
- Create: `playwright.config.ts` (project root)
- Delete: `e2e/playwright.config.ts`
- Modify: `jest.config.ts`
- Modify: `package.json`

- [x] **Step 1: Create root-level playwright.config.ts**

Create `playwright.config.ts` at the project root with this content:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

- [x] **Step 2: Delete the old config inside e2e/**

```bash
git rm e2e/playwright.config.ts
```

- [x] **Step 3: Add testPathIgnorePatterns to jest.config.ts**

Open `jest.config.ts`. Change:

```typescript
// Before
const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

To:

```typescript
// After
const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};
```

- [x] **Step 4: Add test:e2e script to package.json**

Open `package.json`. Change:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest"
},
```

To:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  "test:e2e": "playwright test"
},
```

- [x] **Step 5: Verify Jest no longer picks up e2e specs**

```bash
npx jest --listTests 2>&1
```
Expected: only files under `src/` are listed — no `e2e/` paths.

- [x] **Step 6: Install Playwright browsers if needed**

```bash
npx playwright install chromium 2>&1 | tail -5
```
Expected: either `chromium` downloads, or `browser is already installed`.

- [x] **Step 7: Run E2E tests against a running dev server**

Start the dev server in a separate terminal first (`npm run dev`), then:

```bash
npx playwright test --reporter=list 2>&1
```
Expected: all tests in `e2e/` pass (or at minimum no `TypeError: Class extends value undefined` error).

- [x] **Step 8: Commit**

```bash
git add playwright.config.ts jest.config.ts package.json
git commit -m "$(cat <<'EOF'
fix: move playwright.config to root and isolate e2e tests from Jest

- playwright.config.ts now lives at root (correct testDir resolution)
- jest.config.ts excludes /e2e/ to prevent Jest from running Playwright specs
- Added test:e2e npm script

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Done

After Task 3, `npm test` runs only Jest unit tests, `npm run test:e2e` runs Playwright, and the font preload warning is gone. The Raspberry Pi sync (pull + `npm run build`) is a manual operational step requiring SSH access to the Pi.
