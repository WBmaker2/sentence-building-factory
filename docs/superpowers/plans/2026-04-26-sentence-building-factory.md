# Sentence Building Factory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tablet-friendly Korean sentence puzzle app where grade 1-2 students arrange colored word blocks and punctuation blocks into correct sentences.

**Architecture:** This is a greenfield Vite + React + TypeScript app. Keep sentence validation in a pure tested module, keep puzzle content in a small typed data file, and keep the UI as a single polished classroom activity surface with local state.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, CSS, lucide-react, Browser Use plugin for localhost verification, ImageGen concepting through the Build Web Apps workflow.

---

## Skill And Plugin Usage

- `superpowers:using-superpowers`: already used to check the required skill workflow before planning.
- `superpowers:writing-plans`: used for this implementation plan and task breakdown.
- `build-web-apps:frontend-app-builder`: use during implementation for a concept-first visual direction, then verify the running UI in a browser.
- `build-web-apps:react-best-practices`: use during implementation if component boundaries or React state patterns become unclear.
- `browser-use:browser`: use after starting the dev server to inspect desktop and mobile localhost views.
- `imagegen`: use before implementation to generate one accepted UI concept for the train/conveyor puzzle surface.
- `playwright`: fallback only if Browser Use cannot capture or interact with the local app reliably.

## Product Scope

This plan implements the first complete classroom-ready version:

- A first-screen app, not a marketing landing page.
- Four sentence slots: `누가`, `무엇을`, `어찌한다`, `문장 부호`.
- Color-coded blocks: blue subject blocks, yellow object blocks, red predicate blocks, green punctuation blocks.
- Mouse drag-and-drop plus click-to-select/click-to-place for touch devices and accessibility.
- A central train/conveyor assembly area and a bottom tray of shuffled word blocks.
- Correct answer checking, friendly feedback, a short celebration animation, and next-sentence progression.
- A compact teacher panel for choosing a sentence set, resetting, and enabling hint mode.
- `aria-live` feedback so status changes are available to assistive technology.

Out of scope for the first version:

- Student accounts, saved class results, teacher dashboards, and remote content editing.
- AI-generated sentence content.
- Audio recording or speech recognition.

## File Structure

- Create: `package.json`  
  Project scripts and dependencies.
- Create: `index.html`  
  Vite root page with Korean metadata.
- Create: `vite.config.ts`  
  React plugin and Vitest jsdom configuration.
- Create: `tsconfig.json`, `tsconfig.node.json`  
  TypeScript configuration with bundler resolution.
- Create: `src/main.tsx`  
  React entrypoint.
- Create: `src/App.tsx`  
  Main sentence puzzle UI and local interaction state.
- Create: `src/App.css`  
  Responsive classroom app styling, block colors, train slots, animation, focus states.
- Create: `src/App.test.tsx`  
  User-flow tests for selecting blocks, checking answers, wrong answer feedback, and progression.
- Create: `src/data/puzzles.ts`  
  Typed puzzle content for grade 1-2 Korean sentence practice.
- Create: `src/data/puzzles.test.ts`  
  Data integrity tests for unique ids and answer consistency.
- Create: `src/lib/sentenceFactory.ts`  
  Pure slot, placement, and sentence evaluation helpers.
- Create: `src/lib/sentenceFactory.test.ts`  
  Unit tests for the pure puzzle logic.
- Create: `src/test/setup.ts`  
  Testing Library jest-dom setup.

## Visual Direction

Use ImageGen before implementation with this prompt:

```text
ui-mockup for a Korean elementary grade 1-2 classroom web app named "뚝딱뚝딱 문장 만들기 공장"; full-screen usable tablet interface, no marketing landing page; central friendly train-car sentence assembly area with four empty slots labeled 누가, 무엇을, 어찌한다, 문장 부호; bottom tray of large colorful draggable Korean word blocks in blue, yellow, red, and green; compact teacher controls in a quiet top bar; warm classroom craft mood, clean whitespace, rounded but not bubbly, high contrast, readable Korean UI text, touch-friendly controls, playful celebration state, restrained palette with sky blue, lemon yellow, coral red, mint green, soft paper background, no decorative orbs, no dense dashboards, no nested cards
```

Accepted concept rules:

- Keep the app surface as the first viewport.
- Keep the central train/conveyor as the main focus.
- Keep bottom blocks large enough for young students on tablets.
- Implement text and controls in code, not baked into the generated concept image.

## Implementation Tasks

### Task 1: Project Scaffold And Baseline Test

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/test/setup.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.css`
- Create: `src/App.test.tsx`

- [ ] **Step 0: Initialize Git if this folder is not already a repository**

Run:

```bash
git status
```

Expected when the folder is already a repository: Git prints the current branch and working tree status.

Expected in this current empty folder: Git prints `fatal: not a git repository`. In that case, run:

```bash
git init
```

Expected: Git creates `.git/` so the commit steps in this plan can run.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "sentence-building-factory",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest --run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.4",
    "lucide-react": "^0.468.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "vite": "^6.0.3"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create Vite and TypeScript config files**

`vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Create HTML and test setup**

`index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="초등 1~2학년 국어 문장 구조와 문장 부호를 익히는 드래그 앤 드롭 문장 퍼즐 앱"
    />
    <title>뚝딱뚝딱 문장 만들기 공장</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Create a minimal app and smoke test**

`src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>뚝딱뚝딱 문장 만들기 공장</h1>
    </main>
  );
}
```

`src/App.css`:

```css
:root {
  font-family: Inter, Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #253047;
  background: #f8f2e8;
}

body {
  margin: 0;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 32px;
}
```

`src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the app title', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: '뚝딱뚝딱 문장 만들기 공장' })).toBeInTheDocument();
});
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and dependencies install without errors.

- [ ] **Step 6: Verify baseline**

Run:

```bash
npm test
npm run build
```

Expected: both commands pass.

- [ ] **Step 7: Commit scaffold**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src
git commit -m "chore: scaffold sentence building factory"
```

### Task 2: Sentence Puzzle Domain Logic

**Files:**
- Create: `src/lib/sentenceFactory.ts`
- Create: `src/lib/sentenceFactory.test.ts`

- [ ] **Step 1: Write failing domain tests**

`src/lib/sentenceFactory.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  createEmptySlots,
  evaluateSentence,
  placeBlock,
  removeBlock,
  type SentencePuzzle,
} from './sentenceFactory';

const puzzle: SentencePuzzle = {
  id: 'dog-eats-bone',
  title: '강아지 문장',
  prompt: '강아지가 무엇을 하는지 문장으로 만들어요.',
  slots: ['subject', 'object', 'predicate', 'punctuation'],
  answer: ['dog-subject', 'bone-object', 'eat-predicate', 'period'],
  feedback: '강아지가 뼈다귀를 먹는 문장이 되었어요.',
  blocks: [
    { id: 'dog-subject', text: '강아지가', role: 'subject' },
    { id: 'bone-object', text: '뼈다귀를', role: 'object' },
    { id: 'eat-predicate', text: '먹는다', role: 'predicate' },
    { id: 'period', text: '.', role: 'punctuation' },
    { id: 'question', text: '?', role: 'punctuation' },
  ],
};

describe('sentenceFactory', () => {
  test('creates empty slots from a puzzle', () => {
    expect(createEmptySlots(puzzle)).toEqual([null, null, null, null]);
  });

  test('places and removes block ids without mutating the original slot array', () => {
    const empty = createEmptySlots(puzzle);
    const placed = placeBlock(empty, 0, 'dog-subject');
    const removed = removeBlock(placed, 0);

    expect(empty).toEqual([null, null, null, null]);
    expect(placed).toEqual(['dog-subject', null, null, null]);
    expect(removed).toEqual([null, null, null, null]);
  });

  test('evaluates a correct complete sentence', () => {
    const result = evaluateSentence(puzzle, ['dog-subject', 'bone-object', 'eat-predicate', 'period']);

    expect(result.isComplete).toBe(true);
    expect(result.isCorrect).toBe(true);
    expect(result.sentenceText).toBe('강아지가 뼈다귀를 먹는다.');
    expect(result.feedback).toBe('강아지가 뼈다귀를 먹는 문장이 되었어요.');
  });

  test('reports incomplete and incorrect sentences', () => {
    const incomplete = evaluateSentence(puzzle, ['dog-subject', null, 'eat-predicate', 'period']);
    const wrong = evaluateSentence(puzzle, ['dog-subject', 'bone-object', 'eat-predicate', 'question']);

    expect(incomplete.isComplete).toBe(false);
    expect(incomplete.isCorrect).toBe(false);
    expect(incomplete.missingLabels).toEqual(['무엇을']);
    expect(wrong.isComplete).toBe(true);
    expect(wrong.isCorrect).toBe(false);
    expect(wrong.feedback).toBe('문장 부호를 다시 살펴봐요.');
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- src/lib/sentenceFactory.test.ts
```

Expected: FAIL because `src/lib/sentenceFactory.ts` does not exist yet.

- [ ] **Step 3: Implement domain logic**

`src/lib/sentenceFactory.ts`:

```ts
export type BlockRole = 'subject' | 'object' | 'predicate' | 'punctuation';

export type SentenceBlock = {
  id: string;
  text: string;
  role: BlockRole;
};

export type SentencePuzzle = {
  id: string;
  title: string;
  prompt: string;
  slots: BlockRole[];
  answer: string[];
  feedback: string;
  blocks: SentenceBlock[];
};

export type SlotState = Array<string | null>;

export type SentenceEvaluation = {
  isComplete: boolean;
  isCorrect: boolean;
  sentenceText: string;
  missingLabels: string[];
  feedback: string;
};

export const roleLabels: Record<BlockRole, string> = {
  subject: '누가',
  object: '무엇을',
  predicate: '어찌한다',
  punctuation: '문장 부호',
};

export function createEmptySlots(puzzle: SentencePuzzle): SlotState {
  return puzzle.slots.map(() => null);
}

export function placeBlock(slots: SlotState, slotIndex: number, blockId: string): SlotState {
  return slots.map((current, index) => (index === slotIndex ? blockId : current));
}

export function removeBlock(slots: SlotState, slotIndex: number): SlotState {
  return slots.map((current, index) => (index === slotIndex ? null : current));
}

export function getBlockById(puzzle: SentencePuzzle, blockId: string | null): SentenceBlock | undefined {
  if (!blockId) {
    return undefined;
  }

  return puzzle.blocks.find((block) => block.id === blockId);
}

export function getSentenceText(puzzle: SentencePuzzle, slots: SlotState): string {
  return slots
    .map((blockId) => getBlockById(puzzle, blockId)?.text ?? '')
    .join(' ')
    .replace(/\s+([.?])/g, '$1')
    .trim();
}

export function evaluateSentence(puzzle: SentencePuzzle, slots: SlotState): SentenceEvaluation {
  const missingLabels = puzzle.slots
    .map((role, index) => (slots[index] ? null : roleLabels[role]))
    .filter((label): label is string => Boolean(label));
  const isComplete = missingLabels.length === 0;
  const isCorrect = isComplete && puzzle.answer.every((blockId, index) => slots[index] === blockId);
  const sentenceText = getSentenceText(puzzle, slots);
  const punctuationSlotIndex = puzzle.slots.indexOf('punctuation');
  const punctuationBlock = getBlockById(puzzle, slots[punctuationSlotIndex] ?? null);

  let feedback = '';
  if (!isComplete) {
    feedback = `${missingLabels.join(', ')} 칸을 채워 보세요.`;
  } else if (isCorrect) {
    feedback = puzzle.feedback;
  } else if (punctuationBlock && punctuationBlock.id !== puzzle.answer[punctuationSlotIndex]) {
    feedback = '문장 부호를 다시 살펴봐요.';
  } else {
    feedback = '단어의 순서를 다시 살펴봐요.';
  }

  return {
    isComplete,
    isCorrect,
    sentenceText,
    missingLabels,
    feedback,
  };
}
```

- [ ] **Step 4: Verify domain tests**

Run:

```bash
npm test -- src/lib/sentenceFactory.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit domain logic**

```bash
git add src/lib/sentenceFactory.ts src/lib/sentenceFactory.test.ts
git commit -m "feat: add sentence puzzle logic"
```

### Task 3: Puzzle Data

**Files:**
- Create: `src/data/puzzles.ts`
- Create: `src/data/puzzles.test.ts`

- [ ] **Step 1: Write failing data tests**

`src/data/puzzles.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { puzzles } from './puzzles';

describe('puzzles', () => {
  test('contains at least four classroom sentence puzzles', () => {
    expect(puzzles).toHaveLength(4);
  });

  test('has unique puzzle ids and block ids', () => {
    const puzzleIds = new Set(puzzles.map((puzzle) => puzzle.id));
    expect(puzzleIds.size).toBe(puzzles.length);

    for (const puzzle of puzzles) {
      const blockIds = new Set(puzzle.blocks.map((block) => block.id));
      expect(blockIds.size).toBe(puzzle.blocks.length);
    }
  });

  test('uses answers that match the puzzle slots', () => {
    for (const puzzle of puzzles) {
      expect(puzzle.answer).toHaveLength(puzzle.slots.length);
      for (const answerId of puzzle.answer) {
        expect(puzzle.blocks.some((block) => block.id === answerId)).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 2: Run failing data test**

Run:

```bash
npm test -- src/data/puzzles.test.ts
```

Expected: FAIL because `src/data/puzzles.ts` does not exist yet.

- [ ] **Step 3: Implement typed puzzle data**

`src/data/puzzles.ts`:

```ts
import type { SentencePuzzle } from '../lib/sentenceFactory';

const slots: SentencePuzzle['slots'] = ['subject', 'object', 'predicate', 'punctuation'];

export const puzzles: SentencePuzzle[] = [
  {
    id: 'dog-eats-bone',
    title: '강아지 문장',
    prompt: '강아지가 무엇을 하는지 문장으로 만들어요.',
    slots,
    answer: ['dog-subject', 'bone-object', 'eat-predicate', 'period'],
    feedback: '강아지가 뼈다귀를 먹는 문장이 되었어요.',
    blocks: [
      { id: 'dog-subject', text: '강아지가', role: 'subject' },
      { id: 'cat-subject', text: '고양이가', role: 'subject' },
      { id: 'bone-object', text: '뼈다귀를', role: 'object' },
      { id: 'book-object', text: '책을', role: 'object' },
      { id: 'eat-predicate', text: '먹는다', role: 'predicate' },
      { id: 'read-predicate', text: '읽는다', role: 'predicate' },
      { id: 'period', text: '.', role: 'punctuation' },
      { id: 'question', text: '?', role: 'punctuation' },
    ],
  },
  {
    id: 'butterfly-flies',
    title: '나비 문장',
    prompt: '나비가 어디에서 어떻게 움직이는지 문장으로 만들어요.',
    slots,
    answer: ['butterfly-subject', 'flower-object', 'fly-predicate', 'period'],
    feedback: '나비가 꽃 위를 날아가는 문장이 되었어요.',
    blocks: [
      { id: 'butterfly-subject', text: '나비가', role: 'subject' },
      { id: 'bird-subject', text: '새가', role: 'subject' },
      { id: 'flower-object', text: '꽃 위를', role: 'object' },
      { id: 'yard-object', text: '마당을', role: 'object' },
      { id: 'fly-predicate', text: '날아간다', role: 'predicate' },
      { id: 'sit-predicate', text: '앉는다', role: 'predicate' },
      { id: 'period', text: '.', role: 'punctuation' },
      { id: 'question', text: '?', role: 'punctuation' },
    ],
  },
  {
    id: 'help-friend-question',
    title: '물음표 문장',
    prompt: '친구에게 묻는 문장에 알맞은 문장 부호를 붙여요.',
    slots,
    answer: ['i-subject', 'friend-object', 'help-predicate', 'question'],
    feedback: '친구에게 묻는 문장에는 물음표가 잘 어울려요.',
    blocks: [
      { id: 'i-subject', text: '내가', role: 'subject' },
      { id: 'teacher-subject', text: '선생님이', role: 'subject' },
      { id: 'friend-object', text: '친구를', role: 'object' },
      { id: 'ball-object', text: '공을', role: 'object' },
      { id: 'help-predicate', text: '도와줄까', role: 'predicate' },
      { id: 'throw-predicate', text: '던진다', role: 'predicate' },
      { id: 'period', text: '.', role: 'punctuation' },
      { id: 'question', text: '?', role: 'punctuation' },
    ],
  },
  {
    id: 'sibling-reads-book',
    title: '동생 문장',
    prompt: '동생이 무엇을 하는지 바른 문장으로 만들어요.',
    slots,
    answer: ['sibling-subject', 'picture-book-object', 'read-predicate', 'period'],
    feedback: '동생이 그림책을 읽는 문장이 되었어요.',
    blocks: [
      { id: 'sibling-subject', text: '동생이', role: 'subject' },
      { id: 'rabbit-subject', text: '토끼가', role: 'subject' },
      { id: 'picture-book-object', text: '그림책을', role: 'object' },
      { id: 'carrot-object', text: '당근을', role: 'object' },
      { id: 'read-predicate', text: '읽는다', role: 'predicate' },
      { id: 'eat-predicate', text: '먹는다', role: 'predicate' },
      { id: 'period', text: '.', role: 'punctuation' },
      { id: 'question', text: '?', role: 'punctuation' },
    ],
  },
];
```

- [ ] **Step 4: Verify data tests**

Run:

```bash
npm test -- src/data/puzzles.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit puzzle data**

```bash
git add src/data/puzzles.ts src/data/puzzles.test.ts
git commit -m "feat: add sentence puzzle data"
```

### Task 4: App Interaction Tests

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Replace smoke test with user-flow tests**

`src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

async function placeBlock(text: string, slotLabel: RegExp) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: new RegExp(`${text} 블록 선택`) }));
  await user.click(screen.getByRole('button', { name: slotLabel }));
}

test('builds a correct sentence and moves to the next puzzle', async () => {
  const user = userEvent.setup();
  render(<App />);

  await placeBlock('강아지가', /1번 칸/);
  await placeBlock('뼈다귀를', /2번 칸/);
  await placeBlock('먹는다', /3번 칸/);
  await placeBlock('.', /4번 칸/);
  await user.click(screen.getByRole('button', { name: '정답 확인' }));

  expect(screen.getByText('참 잘했어요!')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('강아지가 뼈다귀를 먹는다.');

  await user.click(screen.getByRole('button', { name: '다음 문장' }));
  expect(screen.getByRole('heading', { name: '나비 문장' })).toBeInTheDocument();
});

test('shows punctuation feedback when the sentence mark is wrong', async () => {
  const user = userEvent.setup();
  render(<App />);

  await placeBlock('강아지가', /1번 칸/);
  await placeBlock('뼈다귀를', /2번 칸/);
  await placeBlock('먹는다', /3번 칸/);
  await placeBlock('?', /4번 칸/);
  await user.click(screen.getByRole('button', { name: '정답 확인' }));

  expect(screen.getByText('문장 부호를 다시 살펴봐요.')).toBeInTheDocument();
});

test('lets the teacher choose a different puzzle', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.selectOptions(screen.getByLabelText('문장 단계 선택'), 'help-friend-question');
  expect(screen.getByRole('heading', { name: '물음표 문장' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run failing interaction tests**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because the current app only renders the title.

- [ ] **Step 3: Keep these tests as the implementation contract**

Do not weaken the assertions. The implementation in Task 5 must expose:

- Block buttons named like `강아지가 블록 선택`.
- Slot buttons named like `1번 칸 누가`.
- A `정답 확인` button.
- A `다음 문장` button after success.
- A select labeled `문장 단계 선택`.
- A `role="status"` live region containing the current feedback and sentence.

### Task 5: Main App Implementation

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement the interactive app surface**

Replace `src/App.tsx` with:

```tsx
import { CheckCircle2, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { puzzles } from './data/puzzles';
import {
  createEmptySlots,
  evaluateSentence,
  getBlockById,
  placeBlock,
  removeBlock,
  roleLabels,
  type SentenceBlock,
  type SlotState,
} from './lib/sentenceFactory';

const successMessage = '참 잘했어요!';

function getRoleClass(block: SentenceBlock) {
  return `word-block word-block--${block.role}`;
}

export default function App() {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [slots, setSlots] = useState<SlotState>(() => createEmptySlots(puzzles[0]));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [hintMode, setHintMode] = useState(true);

  const puzzle = puzzles[puzzleIndex];
  const evaluation = useMemo(() => evaluateSentence(puzzle, slots), [puzzle, slots]);
  const usedBlockIds = new Set(slots.filter((blockId): blockId is string => Boolean(blockId)));
  const availableBlocks = puzzle.blocks.filter((block) => !usedBlockIds.has(block.id));
  const selectedBlock = getBlockById(puzzle, selectedBlockId);
  const showSuccess = checked && evaluation.isCorrect;
  const statusMessage = checked
    ? `${evaluation.feedback} ${evaluation.sentenceText}`
    : selectedBlock
      ? `${selectedBlock.text} 블록을 골랐어요. 넣을 칸을 눌러 보세요.`
      : evaluation.sentenceText || '단어 블록을 골라 문장을 만들어 보세요.';

  function loadPuzzle(nextIndex: number) {
    const nextPuzzle = puzzles[nextIndex];
    setPuzzleIndex(nextIndex);
    setSlots(createEmptySlots(nextPuzzle));
    setSelectedBlockId(null);
    setChecked(false);
  }

  function handleSelectBlock(blockId: string) {
    setSelectedBlockId((current) => (current === blockId ? null : blockId));
    setChecked(false);
  }

  function handlePlace(slotIndex: number, blockId: string) {
    setSlots((current) => placeBlock(current, slotIndex, blockId));
    setSelectedBlockId(null);
    setChecked(false);
  }

  function handleSlotClick(slotIndex: number) {
    if (selectedBlockId) {
      handlePlace(slotIndex, selectedBlockId);
      return;
    }

    setSlots((current) => removeBlock(current, slotIndex));
    setChecked(false);
  }

  function handleDrop(event: React.DragEvent<HTMLButtonElement>, slotIndex: number) {
    event.preventDefault();
    const blockId = event.dataTransfer.getData('text/plain');
    if (blockId) {
      handlePlace(slotIndex, blockId);
    }
  }

  function handleCheck() {
    setChecked(true);
  }

  function handleReset() {
    setSlots(createEmptySlots(puzzle));
    setSelectedBlockId(null);
    setChecked(false);
  }

  function handleNext() {
    loadPuzzle((puzzleIndex + 1) % puzzles.length);
  }

  return (
    <main className={`factory-app${showSuccess ? ' factory-app--celebrating' : ''}`}>
      <header className="factory-topbar">
        <div>
          <p className="eyebrow">1~2학년 국어 · 문장 만들기</p>
          <h1>뚝딱뚝딱 문장 만들기 공장</h1>
        </div>
        <section className="teacher-tools" aria-label="교사용 설정">
          <label>
            문장 단계 선택
            <select value={puzzle.id} onChange={(event) => loadPuzzle(puzzles.findIndex((item) => item.id === event.target.value))}>
              {puzzles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={hintMode} onChange={(event) => setHintMode(event.target.checked)} />
            힌트
          </label>
        </section>
      </header>

      <section className="factory-stage" aria-labelledby="puzzle-title">
        <div className="prompt-panel">
          <p className="stage-count">{puzzleIndex + 1} / {puzzles.length}</p>
          <h2 id="puzzle-title">{puzzle.title}</h2>
          <p>{puzzle.prompt}</p>
        </div>

        <div className="conveyor" aria-label="문장 조립 칸">
          {puzzle.slots.map((role, index) => {
            const block = getBlockById(puzzle, slots[index]);
            return (
              <button
                className={`sentence-slot sentence-slot--${role}${block ? ' sentence-slot--filled' : ''}`}
                key={`${role}-${index}`}
                onClick={() => handleSlotClick(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, index)}
                aria-label={`${index + 1}번 칸 ${roleLabels[role]}`}
              >
                <span className="slot-label">{roleLabels[role]}</span>
                <span className="slot-word">{block?.text ?? '놓기'}</span>
              </button>
            );
          })}
        </div>

        <div className="controls">
          <button className="secondary-button" type="button" onClick={handleReset}>
            <RotateCcw aria-hidden="true" size={20} />
            다시 놓기
          </button>
          <button className="primary-button" type="button" onClick={handleCheck}>
            <CheckCircle2 aria-hidden="true" size={20} />
            정답 확인
          </button>
          {showSuccess ? (
            <button className="next-button" type="button" onClick={handleNext}>
              다음 문장
              <ChevronRight aria-hidden="true" size={20} />
            </button>
          ) : null}
        </div>

        <div className={`feedback${showSuccess ? ' feedback--success' : ''}`}>
          {showSuccess ? <Sparkles aria-hidden="true" size={24} /> : null}
          <strong>{showSuccess ? successMessage : checked ? evaluation.feedback : '문장을 조립해 보세요.'}</strong>
          <span>{evaluation.sentenceText || '단어 블록을 기차 칸에 올려놓으면 문장이 보여요.'}</span>
        </div>
      </section>

      <section className="block-tray" aria-label="단어 블록 모음">
        {availableBlocks.map((block) => (
          <button
            key={block.id}
            className={`${getRoleClass(block)}${selectedBlockId === block.id ? ' word-block--selected' : ''}`}
            type="button"
            draggable
            onClick={() => handleSelectBlock(block.id)}
            onDragStart={(event) => event.dataTransfer.setData('text/plain', block.id)}
            aria-pressed={selectedBlockId === block.id}
            aria-label={`${block.text} 블록 선택`}
          >
            <span>{hintMode ? roleLabels[block.role] : ''}</span>
            {block.text}
          </button>
        ))}
      </section>

      <p className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Run interaction tests**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS. If the test fails because duplicate `.` or `?` block names exist across later puzzles, keep each puzzle local and only render the current puzzle's blocks.

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit app behavior**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: build sentence factory interactions"
```

### Task 6: Responsive Classroom Styling

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: Replace baseline CSS with final styling**

`src/App.css`:

```css
:root {
  font-family: Inter, Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #253047;
  background: #f8f2e8;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
select,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.factory-app {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 20px;
  padding: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(255, 255, 255, 0.24)),
    #f8f2e8;
}

.factory-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.eyebrow,
.stage-count {
  margin: 0 0 6px;
  color: #65708a;
  font-size: 0.92rem;
  font-weight: 700;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-size: clamp(1.75rem, 3vw, 2.7rem);
  line-height: 1.15;
}

h2 {
  margin-bottom: 8px;
  font-size: 1.55rem;
}

.teacher-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 2px solid #e0d7c8;
  border-radius: 8px;
  background: #fffaf1;
}

.teacher-tools label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #46516a;
  font-weight: 700;
}

.teacher-tools select {
  min-height: 40px;
  border: 2px solid #cfc3b2;
  border-radius: 8px;
  padding: 0 10px;
  background: #ffffff;
  color: #253047;
}

.toggle input {
  inline-size: 20px;
  block-size: 20px;
}

.factory-stage {
  display: grid;
  align-content: center;
  gap: 22px;
  width: min(1080px, 100%);
  margin: 0 auto;
}

.prompt-panel {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 3px solid #ded1bd;
  padding-bottom: 14px;
}

.prompt-panel p:last-child {
  max-width: 520px;
  margin-bottom: 0;
  color: #4d5872;
  font-size: 1.05rem;
  font-weight: 700;
}

.conveyor {
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: 14px;
  padding: 18px;
  border: 3px solid #85735d;
  border-radius: 8px;
  background:
    linear-gradient(90deg, transparent 0 48%, rgba(133, 115, 93, 0.18) 48% 52%, transparent 52%),
    #fff8e7;
  box-shadow: inset 0 -10px 0 rgba(133, 115, 93, 0.12);
}

.sentence-slot {
  min-height: 132px;
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 14px;
  border: 3px dashed #b8a68c;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.74);
  color: #253047;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.sentence-slot:focus-visible,
.word-block:focus-visible,
.primary-button:focus-visible,
.secondary-button:focus-visible,
.next-button:focus-visible,
select:focus-visible,
input:focus-visible {
  outline: 4px solid #284bff;
  outline-offset: 3px;
}

.sentence-slot:hover {
  transform: translateY(-2px);
  border-color: #75644f;
}

.sentence-slot--filled {
  border-style: solid;
  background: #ffffff;
}

.slot-label {
  color: #67718c;
  font-size: 0.95rem;
  font-weight: 800;
}

.slot-word {
  min-height: 42px;
  display: grid;
  place-items: center;
  font-size: clamp(1.18rem, 2vw, 1.55rem);
  font-weight: 900;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.primary-button,
.secondary-button,
.next-button {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 8px;
  padding: 0 18px;
  font-weight: 900;
}

.primary-button {
  background: #253047;
  color: #ffffff;
}

.secondary-button {
  background: #e8dfd1;
  color: #253047;
}

.next-button {
  background: #1f9d74;
  color: #ffffff;
}

.feedback {
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px;
  border: 2px solid #e0d7c8;
  border-radius: 8px;
  background: #fffaf1;
  text-align: center;
}

.feedback strong {
  font-size: 1.16rem;
}

.feedback span {
  color: #57627a;
  font-weight: 700;
}

.feedback--success {
  border-color: #1f9d74;
  background: #eaf8f2;
  color: #12684e;
}

.block-tray {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(124px, 1fr));
  gap: 12px;
  width: min(1080px, 100%);
  margin: 0 auto;
  padding: 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  border: 2px solid #e0d7c8;
}

.word-block {
  min-height: 70px;
  display: grid;
  place-items: center;
  gap: 4px;
  border: 3px solid rgba(37, 48, 71, 0.2);
  border-radius: 8px;
  padding: 10px;
  color: #253047;
  font-size: 1.15rem;
  font-weight: 900;
  box-shadow: 0 7px 0 rgba(37, 48, 71, 0.18);
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.word-block span {
  color: rgba(37, 48, 71, 0.72);
  font-size: 0.78rem;
}

.word-block:hover,
.word-block--selected {
  transform: translateY(-4px);
  box-shadow: 0 11px 0 rgba(37, 48, 71, 0.16);
}

.word-block--subject {
  background: #9ed9ff;
}

.word-block--object {
  background: #ffe37a;
}

.word-block--predicate {
  background: #ff9b8f;
}

.word-block--punctuation {
  background: #9ee7c1;
}

.factory-app--celebrating .conveyor {
  animation: celebrate 520ms ease both;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes celebrate {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.018) rotate(-0.4deg);
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }
}

@media (max-width: 760px) {
  .factory-app {
    padding: 14px;
  }

  .factory-topbar,
  .prompt-panel,
  .teacher-tools {
    align-items: stretch;
    flex-direction: column;
  }

  .conveyor {
    grid-template-columns: 1fr;
  }

  .sentence-slot {
    min-height: 94px;
  }

  .block-tray {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 2: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and production build completes.

- [ ] **Step 3: Commit styling**

```bash
git add src/App.css
git commit -m "style: polish sentence factory interface"
```

### Task 7: Browser Verification And Fix Pass

**Files:**
- Modify only the files required by issues found during verification.

- [ ] **Step 1: Start the dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 2: Verify with Browser Use**

Open the local URL in Browser Use and check:

- Desktop viewport around `1440x900`: topbar fits, central train area is visible, bottom blocks are visible without overlapping.
- Mobile viewport around `390x844`: slots stack vertically, block tray uses two columns, buttons wrap cleanly.
- Click flow: select `강아지가`, place in slot 1; select `뼈다귀를`, place in slot 2; select `먹는다`, place in slot 3; select `.`, place in slot 4; click `정답 확인`; confirm `참 잘했어요!`; click `다음 문장`.
- Error flow: choose wrong punctuation and confirm `문장 부호를 다시 살펴봐요.` appears.
- Teacher flow: switch the select to `물음표 문장` and confirm puzzle content resets.
- Accessibility flow: tab to blocks and slots, confirm focus outline is visible; confirm `role="status"` updates after checking an answer.

- [ ] **Step 3: Fix material browser issues**

If Browser Use finds layout or interaction problems, fix them in the smallest relevant file:

- `src/App.css` for overlap, wrapping, contrast, focus, and responsive sizing.
- `src/App.tsx` for incorrect labels, drag/drop, select reset, status text, and button state.
- `src/lib/sentenceFactory.ts` for sentence text or feedback logic.

After each fix, run:

```bash
npm test
npm run build
```

Expected: both commands pass.

- [ ] **Step 4: Commit verification fixes**

```bash
git add src/App.tsx src/App.css src/lib/sentenceFactory.ts src/App.test.tsx src/lib/sentenceFactory.test.ts src/data/puzzles.ts src/data/puzzles.test.ts
git commit -m "fix: refine sentence factory browser experience"
```

Only create this commit if there were verification fixes.

### Task 8: Optional GitHub Pages Deployment

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `vite.config.ts`
- Modify: `package.json`

Use this task only if the user asks for deployment.

- [ ] **Step 1: Add a Vite base path for GitHub Pages**

In `vite.config.ts`, set:

```ts
export default defineConfig({
  base: '/sentence-building-factory/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
```

- [ ] **Step 2: Add deploy workflow**

`.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Verify deploy locally before pushing**

Run:

```bash
npm test
npm run build
```

Expected: both pass.

## Self-Review Checklist

- Spec coverage: drag-and-drop, click/touch fallback, colored word blocks, sentence slots, punctuation, correct answer animation, next stage, teacher choice, and grade 1-2 Korean context are all covered.
- Accessibility coverage: keyboard flow, visible focus, button names, select label, and `aria-live` status are covered.
- Test coverage: pure logic tests, data integrity tests, user-flow tests, build verification, and browser verification are covered.
- Visual coverage: concept-first UI, train/conveyor center, bottom tray, responsive desktop/mobile behavior, and non-overlap checks are covered.
- Deployment coverage: optional GitHub Pages task is included but not part of the default implementation unless requested.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-26-sentence-building-factory.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - dispatch a fresh worker per task, review between tasks, fast iteration.
2. **Inline Execution** - execute tasks in this session using `superpowers:executing-plans`, with checkpoints after task groups.
