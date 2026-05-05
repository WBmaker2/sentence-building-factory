# Sentence Factory v1.4 Lesson Exports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add teacher-friendly lesson wrap-up tools for copying results, downloading CSV, and printing an activity worksheet.

**Architecture:** Keep the app static and client-only. Reuse the existing lesson-mode puzzle state, completed sentence set, and custom-puzzle merge list to derive export rows and printable worksheet content. Use browser clipboard, Blob downloads, and `window.print()` without adding any backend, account, or persistence layer.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, CSS, browser Clipboard API, Blob download API, print media CSS.

---

## File Structure

- Modify: `src/App.tsx`  
  Add derived lesson result rows, formatted copy text, CSV generation/download, print trigger, teacher wrap-up summary, and printable worksheet markup.
- Modify: `src/App.css`  
  Style the lesson wrap-up controls, worksheet preview, and print-only layout.
- Modify: `src/App.test.tsx`  
  Add coverage for rich result copying, CSV download, and print worksheet behavior.

## Task 1: Add Lesson Export Tests

**Files:**
- Modify: `src/App.test.tsx`

- [x] **Step 1: Update the copy test**

Assert that `수업 결과 복사` copies a lesson summary containing the active lesson set, completion counts, and the completed sentence text.

- [x] **Step 2: Add CSV download test**

Stub `window.URL.createObjectURL`, complete one sentence, click `CSV 저장`, and assert the generated Blob contains headers for `문장 세트`, `문장 이름`, `완성 문장`, `문장 부호`, `완료 여부`.

- [x] **Step 3: Add print test**

Stub `window.print`, open `수업 진행`, click `활동지 인쇄`, and assert the print function is called and the `인쇄용 활동지` worksheet remains visible.

## Task 2: Implement Lesson Export Data

**Files:**
- Modify: `src/App.tsx`

- [x] **Step 1: Add export row helpers**

Create lesson rows from `activePuzzles`, `activeLessonSet`, and `completedPuzzleIds` with fields for set label, title, sentence text, punctuation, and completion status.

- [x] **Step 2: Add copy text formatting**

Replace the old completed-only text with a richer lesson summary:

```text
뚝딱뚝딱 문장 만들기 공장 수업 결과
문장 세트: 전체 문장 세트
완성: 1/12

1. [완료] 강아지 문장 - 강아지가 뼈다귀를 먹는다.
2. [연습 전] 나비 문장 - 나비가 꽃을 찾는다.
```

- [x] **Step 3: Add CSV formatting**

Generate a BOM-prefixed CSV file with escaped cells so Korean text opens cleanly in spreadsheet apps.

## Task 3: Add Teacher Wrap-Up UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [x] **Step 1: Add lesson summary tiles**

Show `오늘 문장`, `완료`, and `남은 문장` counts near the lesson controls.

- [x] **Step 2: Add wrap-up action buttons**

Add `수업 결과 복사`, `CSV 저장`, and `활동지 인쇄` buttons with familiar icons and polite status messages.

- [x] **Step 3: Add printable worksheet section**

Render the active sentence set as a worksheet preview with name/date blanks and role columns for `누가`, `무엇을`, `어찌한다`, and `문장 부호`.

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

Check desktop and mobile. Verify lesson wrap-up summary, CSV button, print button, and worksheet layout render without overlap.

- [ ] **Step 4: Commit, push, and verify Pages**

Commit with:

```bash
git commit -m "feat: add lesson export tools"
```

Then push and verify the GitHub Pages workflow succeeds.
