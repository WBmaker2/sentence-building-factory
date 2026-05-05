# Sentence Factory v1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the published sentence-building app more classroom-ready by turning visible toolbar items into real features, restoring local QA reliability, expanding sentence content, and adding read-aloud support.

**Architecture:** Keep puzzle validation pure in `src/lib/sentenceFactory.ts` and keep classroom content in `src/data/puzzles.ts`. Extend `src/App.tsx` with local UI state for the current view, completed puzzles, and read-aloud behavior without introducing accounts, storage, or backend services. Keep styling in `src/App.css` and protect user-visible flows with Testing Library tests.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, CSS, browser `speechSynthesis`, GitHub Pages.

---

## Current State

- The MVP is already deployed at `https://wbmaker2.github.io/sentence-building-factory/`.
- The app is registered in Hong's Vibe Coding Lab.
- The latest GitHub Actions Pages run passed on `main`.
- Local `npm test` and `npm run build` currently fail because Rollup's native optional dependency in `node_modules` has a macOS code-signature/loading problem. This is a local dependency state problem, not an app-code failure.

## File Structure

- Modify: `src/App.tsx`  
  Add view state for `학생 모드`, `진행 현황`, `문장 예시`; track completed puzzle ids; add read-aloud button; expose teacher controls as a real popover/panel.
- Modify: `src/App.css`  
  Style the toolbar as interactive controls, add side panels/summary surfaces, keep mobile layout stable.
- Modify: `src/App.test.tsx`  
  Add tests for toolbar view switching, progress updates after correct answers, example sentence rendering, and read-aloud fallback behavior.
- Modify: `src/data/puzzles.ts`  
  Expand from 4 to at least 10 classroom sentence puzzles while keeping grade 1-2 vocabulary.
- Modify: `src/data/puzzles.test.ts`  
  Raise the minimum puzzle count and keep answer-role validation.
- No changes planned: `src/lib/sentenceFactory.ts` unless tests expose a pure logic gap.

## Task 1: Restore Local QA Baseline

**Files:**
- Verify only: `package-lock.json`
- Verify only: `node_modules`

- [x] **Step 1: Reinstall dependencies from lockfile**

Run:

```bash
/opt/homebrew/bin/npm ci
```

Expected: `node_modules` is recreated from `package-lock.json` and Rollup's native optional dependency loads correctly.

- [x] **Step 2: Run tests**

Run:

```bash
/opt/homebrew/bin/npm test
```

Expected: all existing Vitest tests pass.

- [x] **Step 3: Run production build**

Run:

```bash
/opt/homebrew/bin/npm run build
```

Expected: TypeScript and Vite production build pass.

## Task 2: Make Toolbar Items Real Controls

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/App.test.tsx`

- [x] **Step 1: Add failing tests for toolbar views**

Add tests that click `진행 현황` and `문장 예시`, then assert the matching panel text is visible. Also assert `학생 모드` returns to the puzzle surface.

- [x] **Step 2: Implement `activeView` state**

In `src/App.tsx`, add:

```ts
type AppView = 'student' | 'progress' | 'examples';
const [activeView, setActiveView] = useState<AppView>('student');
```

Convert the current decorative toolbar spans into buttons that call `setActiveView`.

- [x] **Step 3: Render classroom panels**

Render a progress panel when `activeView === 'progress'` and an example panel when `activeView === 'examples'`. Keep the train puzzle visible in student mode.

## Task 3: Track Progress During a Session

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [x] **Step 1: Add failing progress test**

Complete one correct sentence, open `진행 현황`, and assert `완성한 문장 1개` is visible.

- [x] **Step 2: Add completed puzzle state**

In `src/App.tsx`, add:

```ts
const [completedPuzzleIds, setCompletedPuzzleIds] = useState<Set<string>>(() => new Set());
```

When a completed sentence is correct, add the current `puzzle.id` to the set.

- [x] **Step 3: Reset progress only from teacher controls**

Add a `진행 초기화` button in the teacher panel that clears `completedPuzzleIds`, current slots, selected block, and checked state.

## Task 4: Add Read-Aloud Support

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/App.test.tsx`

- [x] **Step 1: Add read-aloud test**

Stub `window.speechSynthesis` and assert clicking `읽어 주기` calls `speak` with the current assembled sentence when available.

- [x] **Step 2: Implement `handleReadAloud`**

Use `window.speechSynthesis` when available. Prefer `evaluation.sentenceText`, then `puzzle.prompt`, so the button still works before blocks are placed.

- [x] **Step 3: Add visible button**

Add a touch-friendly `읽어 주기` button near the reset/check controls with a speaker-style icon from `lucide-react`.

## Task 5: Expand Puzzle Content

**Files:**
- Modify: `src/data/puzzles.ts`
- Modify: `src/data/puzzles.test.ts`

- [x] **Step 1: Raise data-count expectation**

Change the puzzle data test to require at least 10 puzzles.

- [x] **Step 2: Add at least six more grade 1-2 puzzles**

Add simple classroom-friendly sentences covering periods, question marks, and exclamation marks. Keep each puzzle to four slots: subject, object, predicate, punctuation.

- [x] **Step 3: Verify answer-role consistency**

Run `npm test` and confirm `src/data/puzzles.test.ts` still verifies all answers use block ids with roles matching slot order.

## Task 6: Browser Verification And Publish

**Files:**
- Modify if needed: `src/App.css`

- [x] **Step 1: Start local dev server**

Run:

```bash
/opt/homebrew/bin/npm run dev -- --host 127.0.0.1
```

- [x] **Step 2: Verify desktop and mobile**

Check desktop `1440x900` and mobile `390x844`. Confirm toolbar panels do not overlap the train surface and word blocks remain tappable.

- [ ] **Step 3: Commit and deploy**

Run:

```bash
git add docs/superpowers/plans/2026-05-05-sentence-factory-v1-1.md src/App.tsx src/App.css src/App.test.tsx src/data/puzzles.ts src/data/puzzles.test.ts
git commit -m "feat: add classroom v1.1 controls"
git push
```

- [ ] **Step 4: Verify GitHub Pages**

Confirm the GitHub Actions Pages workflow passes and the public app still returns `HTTP/2 200`.
