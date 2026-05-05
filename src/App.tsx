import {
  BarChart3,
  BookOpenText,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  RotateCcw,
  Sparkles,
  UserRound,
  UsersRound,
  Volume2,
} from 'lucide-react';
import { useMemo, useState, type DragEvent } from 'react';
import { puzzles } from './data/puzzles';
import {
  createEmptySlots,
  evaluateSentence,
  getBlockById,
  getSentenceText,
  placeBlock,
  removeBlock,
  roleLabels,
  type SentenceBlock,
  type SentencePuzzle,
  type SlotState,
} from './lib/sentenceFactory';

const successMessage = '참 잘했어요!';
type AppView = 'student' | 'lesson' | 'progress' | 'examples';
type LessonSetId = 'all' | 'period' | 'question' | 'exclamation';
type PracticeMode = 'sequential' | 'random';
const assetUrl = (fileName: string) => `${import.meta.env.BASE_URL}assets/${fileName}`;

const generatedAssets = {
  factory: assetUrl('factory-icon.png'),
  gear: assetUrl('gear-icon.png'),
  locomotive: assetUrl('locomotive.png'),
  robot: assetUrl('robot-mascot.png'),
};

const viewOptions: Array<{ id: AppView; label: string; icon: typeof UsersRound }> = [
  { id: 'student', label: '학생 모드', icon: UsersRound },
  { id: 'lesson', label: '수업 진행', icon: ClipboardList },
  { id: 'progress', label: '진행 현황', icon: BarChart3 },
  { id: 'examples', label: '문장 예시', icon: BookOpenText },
];

const lessonSets: Array<{ id: LessonSetId; label: string; helper: string }> = [
  { id: 'all', label: '전체 문장 세트', helper: '모든 문장 부호를 골고루 연습해요.' },
  { id: 'period', label: '마침표 문장 세트', helper: '생각이나 겪은 일을 마침표로 끝내요.' },
  { id: 'question', label: '물음표 문장 세트', helper: '묻는 문장을 물음표로 끝내요.' },
  { id: 'exclamation', label: '느낌표 문장 세트', helper: '느낌을 살려 느낌표로 끝내요.' },
];

function getRoleClass(block: SentenceBlock) {
  return `word-block word-block--${block.role}`;
}

function getSlotLabel(index: number, roleLabel: string, block?: SentenceBlock) {
  const baseLabel = `${index + 1}번 칸 ${roleLabel}`;
  return block
    ? `${baseLabel}, ${block.text} 놓임. 선택한 블록이 없으면 눌러서 빼기`
    : `${baseLabel}, 비어 있음. 선택한 블록을 눌러서 놓기`;
}

function getAnswerPunctuation(puzzle: SentencePuzzle) {
  const punctuationIndex = puzzle.slots.indexOf('punctuation');
  const punctuationBlockId = puzzle.answer[punctuationIndex] ?? null;
  return getBlockById(puzzle, punctuationBlockId)?.text;
}

function matchesLessonSet(puzzle: SentencePuzzle, lessonSetId: LessonSetId) {
  const punctuation = getAnswerPunctuation(puzzle);

  if (lessonSetId === 'period') {
    return punctuation === '.';
  }

  if (lessonSetId === 'question') {
    return punctuation === '?';
  }

  if (lessonSetId === 'exclamation') {
    return punctuation === '!';
  }

  return true;
}

export default function App() {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [slots, setSlots] = useState<SlotState>(() => createEmptySlots(puzzles[0]));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [hintMode, setHintMode] = useState(true);
  const [activeView, setActiveView] = useState<AppView>('student');
  const [completedPuzzleIds, setCompletedPuzzleIds] = useState<Set<string>>(() => new Set());
  const [readAloudMessage, setReadAloudMessage] = useState('');
  const [lessonSetId, setLessonSetId] = useState<LessonSetId>('all');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('sequential');
  const [copyMessage, setCopyMessage] = useState('');

  const activePuzzles = useMemo(
    () => puzzles.filter((item) => matchesLessonSet(item, lessonSetId)),
    [lessonSetId],
  );
  const boundedPuzzleIndex = Math.min(puzzleIndex, activePuzzles.length - 1);
  const puzzle = activePuzzles[boundedPuzzleIndex] ?? puzzles[0];
  const evaluation = useMemo(() => evaluateSentence(puzzle, slots), [puzzle, slots]);
  const usedBlockIds = new Set(slots.filter((blockId): blockId is string => Boolean(blockId)));
  const availableBlocks = puzzle.blocks.filter((block) => !usedBlockIds.has(block.id));
  const selectedBlock = getBlockById(puzzle, selectedBlockId);
  const showSuccess = checked && evaluation.isCorrect;
  const activeLessonSet = lessonSets.find((set) => set.id === lessonSetId) ?? lessonSets[0];
  const completedPuzzles = useMemo(
    () => puzzles.filter((item) => completedPuzzleIds.has(item.id)),
    [completedPuzzleIds],
  );
  const completedSentencesText = completedPuzzles
    .map((item, index) => `${index + 1}. ${getSentenceText(item, item.answer)}`)
    .join('\n');
  const completedInActiveSet = activePuzzles.filter((item) => completedPuzzleIds.has(item.id)).length;
  const statusMessage = copyMessage || readAloudMessage || (checked
    ? `${evaluation.feedback} ${evaluation.sentenceText}`
    : selectedBlock
      ? `${selectedBlock.text} 블록을 골랐어요. 넣을 칸을 눌러 보세요.`
      : evaluation.sentenceText || '단어 블록을 골라 문장을 만들어 보세요.');

  function loadPuzzle(nextIndex: number) {
    const nextPuzzle = activePuzzles[nextIndex];
    if (!nextPuzzle) {
      return;
    }

    setPuzzleIndex(nextIndex);
    setSlots(createEmptySlots(nextPuzzle));
    setSelectedBlockId(null);
    setChecked(false);
    setReadAloudMessage('');
    setCopyMessage('');
    setActiveView('student');
  }

  function handleSelectBlock(blockId: string) {
    setSelectedBlockId((current) => (current === blockId ? null : blockId));
    setChecked(false);
    setReadAloudMessage('');
    setCopyMessage('');
  }

  function handlePlace(slotIndex: number, blockId: string) {
    setSlots((current) => placeBlock(current, slotIndex, blockId));
    setSelectedBlockId(null);
    setChecked(false);
    setReadAloudMessage('');
    setCopyMessage('');
  }

  function handleSlotClick(slotIndex: number) {
    if (selectedBlockId) {
      handlePlace(slotIndex, selectedBlockId);
      return;
    }

    setSlots((current) => removeBlock(current, slotIndex));
    setChecked(false);
    setReadAloudMessage('');
    setCopyMessage('');
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
    setReadAloudMessage('');
    setCopyMessage('');

    if (evaluation.isCorrect) {
      setCompletedPuzzleIds((current) => {
        const next = new Set(current);
        next.add(puzzle.id);
        return next;
      });
    }
  }

  function handleReset() {
    setSlots(createEmptySlots(puzzle));
    setSelectedBlockId(null);
    setChecked(false);
    setReadAloudMessage('');
    setCopyMessage('');
  }

  function handleNext() {
    if (activePuzzles.length === 0) {
      return;
    }

    if (practiceMode === 'random' && activePuzzles.length > 1) {
      let nextIndex = Math.floor(Math.random() * activePuzzles.length);
      if (nextIndex === boundedPuzzleIndex) {
        nextIndex = (nextIndex + 1) % activePuzzles.length;
      }
      loadPuzzle(nextIndex);
      return;
    }

    loadPuzzle((boundedPuzzleIndex + 1) % activePuzzles.length);
  }

  function handleProgressReset() {
    setCompletedPuzzleIds(new Set());
    handleReset();
    setActiveView('student');
  }

  function handleLessonSetChange(nextLessonSetId: LessonSetId) {
    const nextPuzzles = puzzles.filter((item) => matchesLessonSet(item, nextLessonSetId));
    const nextPuzzle = nextPuzzles[0] ?? puzzles[0];

    setLessonSetId(nextLessonSetId);
    setPuzzleIndex(0);
    setSlots(createEmptySlots(nextPuzzle));
    setSelectedBlockId(null);
    setChecked(false);
    setReadAloudMessage('');
    setCopyMessage('');
  }

  async function handleCopyResults() {
    if (!completedSentencesText) {
      setCopyMessage('복사할 완성 문장이 아직 없어요.');
      return;
    }

    const clipboard = window.navigator.clipboard;
    if (!clipboard) {
      setCopyMessage('이 브라우저에서는 자동 복사를 지원하지 않아요.');
      return;
    }

    try {
      await clipboard.writeText(completedSentencesText);
      setCopyMessage('완성 문장을 복사했어요.');
    } catch {
      setCopyMessage('이 브라우저에서는 자동 복사를 지원하지 않아요.');
    }
  }

  function handleReadAloud() {
    const textToRead = evaluation.sentenceText || puzzle.prompt;
    const synthesis = window.speechSynthesis;
    setCopyMessage('');

    if (!synthesis) {
      setReadAloudMessage('읽어 주기를 지원하지 않는 브라우저예요.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'ko-KR';
    synthesis.cancel();
    synthesis.speak(utterance);
    setReadAloudMessage(`${textToRead} 문장을 읽어 주고 있어요.`);
  }

  const progressCount = completedPuzzleIds.size;

  return (
    <main className={`factory-app${showSuccess ? ' factory-app--celebrating' : ''}`}>
      <header className="factory-topbar">
        <div className="brand-area">
          <img className="brand-art-icon brand-art-icon--gear" src={generatedAssets.gear} alt="" aria-hidden="true" />
          <img className="brand-art-icon brand-art-icon--factory" src={generatedAssets.factory} alt="" aria-hidden="true" />
          <div>
            <p className="eyebrow">1~2학년 국어 · 문장 만들기</p>
            <h1>
              <span>뚝딱뚝딱</span> 문장 만들기 <span>공장</span>
            </h1>
          </div>
        </div>
        <div className="top-actions">
          <nav className="mode-pills" aria-label="활동 보기">
            {viewOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  className={`mode-pill${activeView === option.id ? ' mode-pill--active' : ''}`}
                  key={option.id}
                  type="button"
                  onClick={() => setActiveView(option.id)}
                  aria-pressed={activeView === option.id}
                >
                  <Icon aria-hidden="true" size={22} />
                  {option.label}
                </button>
              );
            })}
          </nav>
          <section className="teacher-tools" aria-label="교사용 설정">
            <label>
              문장 단계 선택
              <select
                value={puzzle.id}
                onChange={(event) =>
                  loadPuzzle(activePuzzles.findIndex((item) => item.id === event.target.value))
                }
              >
                {activePuzzles.map((item) => (
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
            <button className="teacher-reset" type="button" onClick={handleProgressReset}>
              진행 초기화
            </button>
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
          <img className="robot-mascot" src={generatedAssets.robot} alt="" aria-hidden="true" />
          <p className="speech-bubble">단어 카드를 기차 칸에 끌어다 놓아 문장을 만들어 보세요!</p>
        </div>

        <div className="prompt-panel">
          <p className="stage-count">
            {boundedPuzzleIndex + 1} / {activePuzzles.length}
          </p>
          <h2 id="puzzle-title">{puzzle.title}</h2>
          <p>{puzzle.prompt}</p>
        </div>

        {activeView === 'student' ? (
          <>
            <div className="train-yard">
              <div className="cloud cloud-left" aria-hidden="true" />
              <div className="cloud cloud-right" aria-hidden="true" />
              <img className="factory-building-image" src={generatedAssets.factory} alt="" aria-hidden="true" />
              <img className="locomotive" src={generatedAssets.locomotive} alt="" aria-hidden="true" />
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
              <button className="secondary-button" type="button" onClick={handleReadAloud}>
                <Volume2 aria-hidden="true" size={20} />
                읽어 주기
              </button>
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
          </>
        ) : null}

        {activeView === 'lesson' ? (
          <section className="classroom-panel lesson-panel" aria-labelledby="lesson-title">
            <div>
              <p className="panel-kicker">수업 준비</p>
              <h2 id="lesson-title">수업 진행</h2>
              <p className="panel-summary">
                {activeLessonSet.label} · {activePuzzles.length}문장 중 {completedInActiveSet}문장 완성
              </p>
            </div>

            <div className="lesson-controls">
              <label className="lesson-control">
                오늘 문장 세트
                <select
                  value={lessonSetId}
                  onChange={(event) => handleLessonSetChange(event.target.value as LessonSetId)}
                >
                  {lessonSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="lesson-control">
                진행 방식
                <select
                  value={practiceMode}
                  onChange={(event) => {
                    setPracticeMode(event.target.value as PracticeMode);
                    setCopyMessage('');
                  }}
                >
                  <option value="sequential">순서대로 풀기</option>
                  <option value="random">랜덤으로 풀기</option>
                </select>
              </label>
            </div>

            <div className="lesson-guide">
              <strong>{activeLessonSet.helper}</strong>
              <span>
                다음 문장 버튼은 현재 세트 안에서만 이동해요. 단계 선택 목록도 오늘 문장 세트에 맞춰 줄어듭니다.
              </span>
            </div>

            <div className="lesson-copy-row">
              <button
                className="secondary-button copy-button"
                type="button"
                onClick={handleCopyResults}
                disabled={completedPuzzles.length === 0}
              >
                <Copy aria-hidden="true" size={20} />
                완성 문장 복사
              </button>
              <span className="copy-message" aria-live="polite">
                {copyMessage || '완성한 문장을 수업 기록으로 모을 수 있어요.'}
              </span>
            </div>

            {completedPuzzles.length > 0 ? (
              <ol className="completed-sentence-list">
                {completedPuzzles.map((item) => (
                  <li key={item.id}>
                    <strong>{item.title}</strong>
                    <span>{getSentenceText(item, item.answer)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-state">아직 완성한 문장이 없어요.</p>
            )}
          </section>
        ) : null}

        {activeView === 'progress' ? (
          <section className="classroom-panel" aria-labelledby="progress-title">
            <div>
              <p className="panel-kicker">오늘의 연습</p>
              <h2 id="progress-title">진행 현황</h2>
              <p className="panel-summary">
                완성한 문장 {progressCount}개
              </p>
            </div>
            <ol className="progress-list">
              {puzzles.map((item) => {
                const completed = completedPuzzleIds.has(item.id);
                return (
                  <li className={completed ? 'progress-item progress-item--done' : 'progress-item'} key={item.id}>
                    <strong>{item.title} {completed ? '완료' : '연습 전'}</strong>
                    <span>{getSentenceText(item, item.answer)}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {activeView === 'examples' ? (
          <section className="classroom-panel" aria-labelledby="examples-title">
            <div>
              <p className="panel-kicker">선생님 문장 카드</p>
              <h2 id="examples-title">문장 예시</h2>
              <p className="panel-summary">정답 문장을 읽고 단어의 자리를 살펴봐요.</p>
            </div>
            <ul className="example-list">
              {puzzles.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{getSentenceText(item, item.answer)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>

      {activeView === 'student' ? (
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
      ) : null}

      <p className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </p>
    </main>
  );
}
