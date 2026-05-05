# Sentence Factory v1.3 Custom Sentences Implementation Plan

**Goal:** Let teachers add their own sentence cards and immediately practice them in the train puzzle.

**Architecture:** Keep the app static and client-only. Store teacher-made puzzles in `localStorage`, merge them with the existing built-in puzzle list at runtime, and expose them through a new `내 문장 세트` option in lesson mode. No backend, login, or sharing scope is added in this version.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, CSS, browser `localStorage`.

---

## File Structure

- Modify: `src/App.tsx`  
  Add custom sentence form state, localStorage load/save, custom puzzle generation, custom lesson filtering, and delete behavior.
- Modify: `src/App.css`  
  Style the teacher sentence form and custom sentence list inside the lesson panel.
- Modify: `src/App.test.tsx`  
  Add coverage for creating a custom sentence, practicing it, and restoring it from localStorage.
- No changes planned: `src/data/puzzles.ts`, `src/lib/sentenceFactory.ts`.

## Task 1: Add Custom Sentence Tests

**Files:**
- Modify: `src/App.test.tsx`

- [x] **Step 1: Clear localStorage before each test**

Prevent teacher-made sentences from leaking between tests.

- [x] **Step 2: Add test for creating and practicing a custom sentence**

Create a sentence from lesson mode, verify the app moves to `내 문장 세트`, assemble the custom blocks, and confirm success.

- [x] **Step 3: Add test for localStorage restore**

Seed `localStorage` with a custom puzzle, open lesson mode, choose `내 문장 세트`, and verify the saved sentence appears.

## Task 2: Implement Custom Puzzle State

**Files:**
- Modify: `src/App.tsx`

- [x] **Step 1: Add custom puzzle load/save helpers**

Use a versioned localStorage key and a defensive parser.

- [x] **Step 2: Merge built-in and custom puzzles**

Use an `allPuzzles` derived list, and update progress/example/completed views to use it.

- [x] **Step 3: Extend lesson sets**

Add `custom` as `내 문장 세트`.

## Task 3: Implement Teacher Sentence Form

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [x] **Step 1: Add form controls**

Provide fields for `문장 이름`, `누가`, `무엇을`, `어찌한다`, and `문장 부호`.

- [x] **Step 2: Generate a playable puzzle**

Create role-colored blocks, answer IDs, and simple distractor blocks so the custom sentence behaves like built-in puzzles.

- [x] **Step 3: Add delete controls**

Allow deleting custom sentences from the lesson panel and clear stale progress for deleted custom puzzles.

## Task 4: Verify And Ship

**Files:**
- Verify: all modified files

- [x] **Step 1: Run tests**

```bash
env PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm test
```

- [x] **Step 2: Run production build**

```bash
env PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run build
```

- [x] **Step 3: Browser smoke test**

Check desktop and mobile. Verify custom sentence creation, custom set selection, and puzzle assembly work.

- [ ] **Step 4: Commit, push, and verify Pages**

Commit with:

```bash
git commit -m "feat: add teacher custom sentences"
```

Then push and verify the GitHub Pages workflow succeeds.
