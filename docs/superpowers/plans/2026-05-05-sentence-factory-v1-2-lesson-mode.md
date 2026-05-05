# Sentence Factory v1.2 Lesson Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a teacher-friendly lesson mode so a teacher can choose a sentence set, choose sequential or random progression, review completed sentences, and copy class results.

**Architecture:** Keep all state local in `src/App.tsx`; do not add accounts, storage, or a backend. Derive lesson sets from existing puzzle data and keep the existing student puzzle flow as the primary screen. Extend the current toolbar with a `수업 진행` view and protect the new classroom workflow with Testing Library tests.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, CSS, browser Clipboard API.

---

## File Structure

- Modify: `src/App.tsx`  
  Add lesson set state, practice order state, active puzzle filtering, copy-results behavior, and a `수업 진행` panel.
- Modify: `src/App.css`  
  Style the new lesson panel, set/order controls, completed sentence list, and copy feedback without breaking mobile layout.
- Modify: `src/App.test.tsx`  
  Add coverage for lesson view switching, set filtering, practice order controls, and copying completed sentences.
- No changes planned: `src/data/puzzles.ts`, `src/lib/sentenceFactory.ts`.

## Task 1: Add Lesson Mode Tests

**Files:**
- Modify: `src/App.test.tsx`

- [x] **Step 1: Add test for lesson view and sentence set filtering**

Add a test that clicks `수업 진행`, selects `물음표 문장 세트`, and asserts the student puzzle count changes to `1 / 2`.

- [x] **Step 2: Add test for copying completed sentences**

Add a test that completes the first puzzle, opens `수업 진행`, clicks `완성 문장 복사`, and asserts clipboard text includes `강아지가 뼈다귀를 먹는다.`.

## Task 2: Implement Lesson State And Filtering

**Files:**
- Modify: `src/App.tsx`

- [x] **Step 1: Add `lessonSetId` and `practiceMode` state**

Use:

```ts
type LessonSetId = 'all' | 'period' | 'question' | 'exclamation';
type PracticeMode = 'sequential' | 'random';
```

- [x] **Step 2: Derive active puzzles**

Filter puzzles by the answer punctuation block: all, period, question, or exclamation.

- [x] **Step 3: Make navigation use active puzzles**

Update current puzzle selection and `다음 문장` so the active set controls the working puzzle list.

## Task 3: Implement Lesson Panel And Copy Results

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [x] **Step 1: Add `수업 진행` toolbar button**

Extend `AppView` and `viewOptions` with a lesson view.

- [x] **Step 2: Render lesson controls**

Render controls for `오늘 문장 세트` and `진행 방식` in the lesson panel.

- [x] **Step 3: Render completed sentence list**

Show completed puzzle titles and sentence text. Show a friendly empty state when nothing is completed.

- [x] **Step 4: Implement copy button**

Use `navigator.clipboard.writeText` when available. Update the `aria-live` status message after copy.

## Task 4: Verify And Ship

**Files:**
- Verify: all modified files

- [x] **Step 1: Run tests**

Run:

```bash
env PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm test
```

- [x] **Step 2: Run production build**

Run:

```bash
env PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run build
```

- [x] **Step 3: Browser smoke test**

Check desktop and mobile. Verify no horizontal overflow and that `수업 진행`, `학생 모드`, and copy flow work.

- [x] **Step 4: Commit, push, and verify Pages**

Commit with:

```bash
git commit -m "feat: add lesson mode controls"
```

Then push and verify the GitHub Pages workflow succeeds.
