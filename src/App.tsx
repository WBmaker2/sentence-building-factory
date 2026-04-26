import {
  BarChart3,
  BookOpenText,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react';
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

function getRoleClass(block: SentenceBlock) {
  return `word-block word-block--${block.role}`;
}

function getSlotLabel(index: number, roleLabel: string, block?: SentenceBlock) {
  const baseLabel = `${index + 1}번 칸 ${roleLabel}`;
  return block
    ? `${baseLabel}, ${block.text} 놓임. 선택한 블록이 없으면 눌러서 빼기`
    : `${baseLabel}, 비어 있음. 선택한 블록을 눌러서 놓기`;
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
        <div className="brand-area">
          <span className="gear-mark" aria-hidden="true">
            <Settings size={26} />
          </span>
          <span className="factory-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <div>
            <p className="eyebrow">1~2학년 국어 · 문장 만들기</p>
            <h1>
              <span>뚝딱뚝딱</span> 문장 만들기 <span>공장</span>
            </h1>
          </div>
        </div>
        <div className="top-actions">
          <nav className="mode-pills" aria-label="활동 보기">
            <span>
              <UsersRound aria-hidden="true" size={22} />
              학생 모드
            </span>
            <span>
              <BarChart3 aria-hidden="true" size={22} />
              진행 현황
            </span>
            <span>
              <BookOpenText aria-hidden="true" size={22} />
              문장 예시
            </span>
          </nav>
          <section className="teacher-tools" aria-label="교사용 설정">
            <label>
              문장 단계 선택
              <select
                value={puzzle.id}
                onChange={(event) =>
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
                onChange={(event) => setHintMode(event.target.checked)}
              />
              힌트
            </label>
            <span className="teacher-chip">
              <UserRound aria-hidden="true" size={22} />
              선생님
              <ChevronDown aria-hidden="true" size={18} />
            </span>
          </section>
        </div>
      </header>

      <section className="factory-stage" aria-labelledby="puzzle-title">
        <div className="helper-strip">
          <div className="robot-mascot" aria-hidden="true">
            <span className="helmet" />
            <span className="face">
              <span className="eye eye-left" />
              <span className="eye eye-right" />
              <span className="smile" />
            </span>
            <span className="wrench" />
          </div>
          <p className="speech-bubble">단어 카드를 기차 칸에 끌어다 놓아 문장을 만들어 보세요!</p>
        </div>

        <div className="prompt-panel">
          <p className="stage-count">
            {puzzleIndex + 1} / {puzzles.length}
          </p>
          <h2 id="puzzle-title">{puzzle.title}</h2>
          <p>{puzzle.prompt}</p>
        </div>

        <div className="train-yard">
          <div className="cloud cloud-left" aria-hidden="true" />
          <div className="cloud cloud-right" aria-hidden="true" />
          <div className="factory-building" aria-hidden="true">
            <span className="chimney" />
            <span className="roof" />
            <span className="wall" />
          </div>
          <div className="locomotive" aria-hidden="true">
            <span className="engine-face" />
            <span className="engine-cab" />
            <span className="engine-stack" />
            <span className="engine-wheel wheel-one" />
            <span className="engine-wheel wheel-two" />
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
                  aria-label={getSlotLabel(index, roleLabels[role], block)}
                >
                  <span className="slot-label">{roleLabels[role]}</span>
                  <span className="slot-word">{block?.text ?? '놓기'}</span>
                  <span className="slot-wheel slot-wheel-left" aria-hidden="true" />
                  <span className="slot-wheel slot-wheel-right" aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <div className="train-track" aria-hidden="true" />
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
