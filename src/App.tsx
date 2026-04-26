import { CheckCircle2, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { useMemo, useState, type DragEvent } from 'react';
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

type SelectChangeEvent = {
  target: {
    value: string;
  };
};

type CheckboxChangeEvent = {
  target: {
    checked: boolean;
  };
};

type DragPreventEvent = {
  preventDefault(): void;
};

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
    if (!nextPuzzle) {
      return;
    }

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

  function handleDrop(event: DragEvent<HTMLButtonElement>, slotIndex: number) {
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
            <select
              value={puzzle.id}
              onChange={(event: SelectChangeEvent) =>
                loadPuzzle(puzzles.findIndex((item) => item.id === event.target.value))
              }
            >
              {puzzles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hintMode}
              onChange={(event: CheckboxChangeEvent) => setHintMode(event.target.checked)}
            />
            힌트
          </label>
        </section>
      </header>

      <section className="factory-stage" aria-labelledby="puzzle-title">
        <div className="prompt-panel">
          <p className="stage-count">
            {puzzleIndex + 1} / {puzzles.length}
          </p>
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
                onDragOver={(event: DragPreventEvent) => event.preventDefault()}
                onDrop={(event: DragEvent<HTMLButtonElement>) => handleDrop(event, index)}
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
            onDragStart={(event: DragEvent<HTMLButtonElement>) => event.dataTransfer.setData('text/plain', block.id)}
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
