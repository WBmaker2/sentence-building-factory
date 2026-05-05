import {
  BarChart3,
  BookOpenText,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Copy,
  FileDown,
  PlusCircle,
  Printer,
  RotateCcw,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react';
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
type LessonSetId = 'all' | 'period' | 'question' | 'exclamation' | 'custom';
type PracticeMode = 'sequential' | 'random';
type CustomSentenceForm = {
  title: string;
  subject: string;
  object: string;
  predicate: string;
  punctuation: '.' | '?' | '!';
};
type LessonResultRow = {
  setLabel: string;
  title: string;
  sentence: string;
  punctuation: string;
  completed: boolean;
};
const assetUrl = (fileName: string) => `${import.meta.env.BASE_URL}assets/${fileName}`;
const customPuzzleStorageKey = 'sentence-factory-custom-puzzles-v1';

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
  { id: 'custom', label: '내 문장 세트', helper: '선생님이 만든 문장을 모아 연습해요.' },
];

const emptyCustomSentenceForm: CustomSentenceForm = {
  title: '',
  subject: '',
  object: '',
  predicate: '',
  punctuation: '.',
};

const fallbackDistractors = {
  subject: ['강아지가', '친구가', '선생님이'],
  object: ['책을', '공을', '노래를'],
  predicate: ['읽는다', '찬다', '부른다'],
};

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

function isCustomPuzzle(puzzle: SentencePuzzle) {
  return puzzle.id.startsWith('teacher-custom-');
}

function matchesLessonSet(puzzle: SentencePuzzle, lessonSetId: LessonSetId) {
  const punctuation = getAnswerPunctuation(puzzle);

  if (lessonSetId === 'custom') {
    return isCustomPuzzle(puzzle);
  }

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

function isSentencePuzzle(value: unknown): value is SentencePuzzle {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const puzzle = value as SentencePuzzle;
  return typeof puzzle.id === 'string'
    && typeof puzzle.title === 'string'
    && typeof puzzle.prompt === 'string'
    && Array.isArray(puzzle.slots)
    && Array.isArray(puzzle.answer)
    && typeof puzzle.feedback === 'string'
    && Array.isArray(puzzle.blocks);
}

function loadCustomPuzzles() {
  try {
    const storedValue = window.localStorage.getItem(customPuzzleStorageKey);
    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue.filter(isSentencePuzzle) : [];
  } catch {
    return [];
  }
}

function saveCustomPuzzles(customPuzzles: SentencePuzzle[]) {
  try {
    window.localStorage.setItem(customPuzzleStorageKey, JSON.stringify(customPuzzles));
  } catch {
    // A blocked storage write should not stop the classroom activity.
  }
}

function getFallbackDistractor(role: keyof typeof fallbackDistractors, correctText: string) {
  return fallbackDistractors[role].find((text) => text !== correctText) ?? fallbackDistractors[role][0];
}

function createCustomPuzzle(form: CustomSentenceForm, order: number): SentencePuzzle {
  const id = `teacher-custom-${Date.now().toString(36)}-${order}`;
  const subject = form.subject.trim();
  const object = form.object.trim();
  const predicate = form.predicate.trim();
  const title = form.title.trim() || `내 문장 ${order}`;
  const punctuationId = `${id}-punctuation-${form.punctuation === '.' ? 'period' : form.punctuation === '?' ? 'question' : 'exclamation'}`;
  const otherPunctuation = form.punctuation === '?' ? '.' : '?';

  return {
    id,
    title,
    prompt: '선생님이 만든 문장을 완성해요.',
    slots: ['subject', 'object', 'predicate', 'punctuation'],
    answer: [`${id}-subject`, `${id}-object`, `${id}-predicate`, punctuationId],
    feedback: '선생님이 만든 문장이 완성되었어요.',
    blocks: [
      { id: `${id}-subject`, text: subject, role: 'subject' },
      { id: `${id}-subject-distractor`, text: getFallbackDistractor('subject', subject), role: 'subject' },
      { id: `${id}-object`, text: object, role: 'object' },
      { id: `${id}-object-distractor`, text: getFallbackDistractor('object', object), role: 'object' },
      { id: `${id}-predicate`, text: predicate, role: 'predicate' },
      { id: `${id}-predicate-distractor`, text: getFallbackDistractor('predicate', predicate), role: 'predicate' },
      { id: punctuationId, text: form.punctuation, role: 'punctuation' },
      { id: `${id}-punctuation-distractor`, text: otherPunctuation, role: 'punctuation' },
    ],
  };
}

function createLessonResultRows(
  lessonSetLabel: string,
  lessonPuzzles: SentencePuzzle[],
  completedPuzzleIds: Set<string>,
): LessonResultRow[] {
  return lessonPuzzles.map((item) => ({
    setLabel: lessonSetLabel,
    title: item.title,
    sentence: getSentenceText(item, item.answer),
    punctuation: getAnswerPunctuation(item) ?? '',
    completed: completedPuzzleIds.has(item.id),
  }));
}

function formatLessonResultsText(
  lessonSetLabel: string,
  rows: LessonResultRow[],
  completedCount: number,
) {
  const summaryLines = [
    '뚝딱뚝딱 문장 만들기 공장 수업 결과',
    `문장 세트: ${lessonSetLabel}`,
    `완성: ${completedCount}/${rows.length}`,
    '',
  ];
  const rowLines = rows.map((row, index) =>
    `${index + 1}. [${row.completed ? '완료' : '연습 전'}] ${row.title} - ${row.sentence}`,
  );

  return [...summaryLines, ...rowLines].join('\n');
}

function escapeCsvCell(value: string | number | boolean) {
  const text = String(value).replace(/\r?\n/g, ' ');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatLessonResultsCsv(rows: LessonResultRow[]) {
  const headers = ['문장 세트', '문장 이름', '완성 문장', '문장 부호', '완료 여부'];
  const csvRows = rows.map((row) => [
    row.setLabel,
    row.title,
    row.sentence,
    row.punctuation,
    row.completed ? '완료' : '연습 전',
  ]);

  return `\uFEFF${[headers, ...csvRows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n')}`;
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
  const [customPuzzles, setCustomPuzzles] = useState<SentencePuzzle[]>(loadCustomPuzzles);
  const [customSentenceForm, setCustomSentenceForm] = useState<CustomSentenceForm>(emptyCustomSentenceForm);
  const [customFormMessage, setCustomFormMessage] = useState('');

  const allPuzzles = useMemo(() => [...puzzles, ...customPuzzles], [customPuzzles]);
  const activePuzzles = useMemo(
    () => allPuzzles.filter((item) => matchesLessonSet(item, lessonSetId)),
    [allPuzzles, lessonSetId],
  );
  const boundedPuzzleIndex = Math.min(puzzleIndex, activePuzzles.length - 1);
  const puzzle = activePuzzles[boundedPuzzleIndex] ?? allPuzzles[0] ?? puzzles[0];
  const evaluation = useMemo(() => evaluateSentence(puzzle, slots), [puzzle, slots]);
  const usedBlockIds = new Set(slots.filter((blockId): blockId is string => Boolean(blockId)));
  const availableBlocks = puzzle.blocks.filter((block) => !usedBlockIds.has(block.id));
  const selectedBlock = getBlockById(puzzle, selectedBlockId);
  const showSuccess = checked && evaluation.isCorrect;
  const activeLessonSet = lessonSets.find((set) => set.id === lessonSetId) ?? lessonSets[0];
  const completedPuzzles = useMemo(
    () => allPuzzles.filter((item) => completedPuzzleIds.has(item.id)),
    [allPuzzles, completedPuzzleIds],
  );
  const completedInActiveSet = activePuzzles.filter((item) => completedPuzzleIds.has(item.id)).length;
  const remainingInActiveSet = activePuzzles.length - completedInActiveSet;
  const lessonResultRows = useMemo(
    () => createLessonResultRows(activeLessonSet.label, activePuzzles, completedPuzzleIds),
    [activeLessonSet.label, activePuzzles, completedPuzzleIds],
  );
  const lessonResultsText = useMemo(
    () => formatLessonResultsText(activeLessonSet.label, lessonResultRows, completedInActiveSet),
    [activeLessonSet.label, completedInActiveSet, lessonResultRows],
  );
  const statusMessage = copyMessage || readAloudMessage || (checked
    ? `${evaluation.feedback} ${evaluation.sentenceText}`
    : selectedBlock
      ? `${selectedBlock.text} 블록을 골랐어요. 넣을 칸을 눌러 보세요.`
      : evaluation.sentenceText || '단어 블록을 골라 문장을 만들어 보세요.');

  useEffect(() => {
    saveCustomPuzzles(customPuzzles);
  }, [customPuzzles]);

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
    const nextPuzzles = allPuzzles.filter((item) => matchesLessonSet(item, nextLessonSetId));
    const nextPuzzle = nextPuzzles[0] ?? puzzle;

    setLessonSetId(nextLessonSetId);
    setPuzzleIndex(0);
    setSlots(createEmptySlots(nextPuzzle));
    setSelectedBlockId(null);
    setChecked(false);
    setReadAloudMessage('');
    setCopyMessage('');
  }

  function handleCustomFormChange(field: keyof CustomSentenceForm, value: string) {
    setCustomSentenceForm((current) => ({
      ...current,
      [field]: field === 'punctuation' ? value as CustomSentenceForm['punctuation'] : value,
    }));
    setCustomFormMessage('');
  }

  function handleAddCustomPuzzle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!customSentenceForm.subject.trim() || !customSentenceForm.object.trim() || !customSentenceForm.predicate.trim()) {
      setCustomFormMessage('누가, 무엇을, 어찌한다 카드를 모두 적어 주세요.');
      return;
    }

    const nextPuzzle = createCustomPuzzle(customSentenceForm, customPuzzles.length + 1);
    const nextCustomPuzzles = [...customPuzzles, nextPuzzle];

    setCustomPuzzles(nextCustomPuzzles);
    setLessonSetId('custom');
    setPuzzleIndex(nextCustomPuzzles.length - 1);
    setSlots(createEmptySlots(nextPuzzle));
    setSelectedBlockId(null);
    setChecked(false);
    setReadAloudMessage('');
    setCopyMessage('');
    setCustomFormMessage(`${nextPuzzle.title}을 넣었어요.`);
    setCustomSentenceForm(emptyCustomSentenceForm);
    setActiveView('student');
  }

  function handleDeleteCustomPuzzle(puzzleId: string) {
    setCustomPuzzles((current) => current.filter((item) => item.id !== puzzleId));
    setCompletedPuzzleIds((current) => {
      const next = new Set(current);
      next.delete(puzzleId);
      return next;
    });

    if (puzzle.id === puzzleId) {
      setLessonSetId('all');
      setPuzzleIndex(0);
      setSlots(createEmptySlots(puzzles[0]));
      setSelectedBlockId(null);
      setChecked(false);
      setReadAloudMessage('');
      setCopyMessage('');
    }
  }

  async function handleCopyResults() {
    if (lessonResultRows.length === 0) {
      setCopyMessage('복사할 수업 결과가 아직 없어요.');
      return;
    }

    const clipboard = window.navigator.clipboard;
    if (!clipboard) {
      setCopyMessage('이 브라우저에서는 자동 복사를 지원하지 않아요.');
      return;
    }

    try {
      await clipboard.writeText(lessonResultsText);
      setCopyMessage('수업 결과를 복사했어요.');
    } catch {
      setCopyMessage('이 브라우저에서는 자동 복사를 지원하지 않아요.');
    }
  }

  function handleDownloadCsv() {
    if (lessonResultRows.length === 0) {
      setCopyMessage('저장할 수업 결과가 아직 없어요.');
      return;
    }

    if (typeof window.URL.createObjectURL !== 'function') {
      setCopyMessage('이 브라우저에서는 CSV 저장을 지원하지 않아요.');
      return;
    }

    const csvContent = formatLessonResultsCsv(lessonResultRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sentence-factory-lesson-results.csv';
    document.body.append(link);
    link.click();
    link.remove();
    if (typeof window.URL.revokeObjectURL === 'function') {
      window.URL.revokeObjectURL(url);
    }
    setCopyMessage('CSV 파일을 만들었어요.');
  }

  function handlePrintWorksheet() {
    if (typeof window.print !== 'function') {
      setCopyMessage('이 브라우저에서는 인쇄를 지원하지 않아요.');
      return;
    }

    setCopyMessage('인쇄 창을 열었어요.');
    window.print();
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

  const progressCount = allPuzzles.filter((item) => completedPuzzleIds.has(item.id)).length;

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
                    <option key={set.id} value={set.id} disabled={set.id === 'custom' && customPuzzles.length === 0}>
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

            <div className="lesson-stats" aria-label="수업 마무리 요약">
              <div className="lesson-stat">
                <span>오늘 문장</span>
                <strong>{activePuzzles.length}</strong>
              </div>
              <div className="lesson-stat lesson-stat--done">
                <span>완료</span>
                <strong>{completedInActiveSet}</strong>
              </div>
              <div className="lesson-stat lesson-stat--remaining">
                <span>남은 문장</span>
                <strong>{remainingInActiveSet}</strong>
              </div>
            </div>

            <form className="custom-sentence-form" onSubmit={handleAddCustomPuzzle}>
              <div className="custom-form-header">
                <p className="panel-kicker">내 문장 카드</p>
                <button className="primary-button custom-add-button" type="submit">
                  <PlusCircle aria-hidden="true" size={20} />
                  내 문장 추가
                </button>
              </div>
              <div className="custom-form-grid">
                <label>
                  문장 이름
                  <input
                    type="text"
                    value={customSentenceForm.title}
                    onChange={(event) => handleCustomFormChange('title', event.target.value)}
                    placeholder="예: 토끼 문장"
                  />
                </label>
                <label>
                  누가 카드
                  <input
                    type="text"
                    value={customSentenceForm.subject}
                    onChange={(event) => handleCustomFormChange('subject', event.target.value)}
                    placeholder="예: 토끼가"
                  />
                </label>
                <label>
                  무엇을 카드
                  <input
                    type="text"
                    value={customSentenceForm.object}
                    onChange={(event) => handleCustomFormChange('object', event.target.value)}
                    placeholder="예: 당근을"
                  />
                </label>
                <label>
                  어찌한다 카드
                  <input
                    type="text"
                    value={customSentenceForm.predicate}
                    onChange={(event) => handleCustomFormChange('predicate', event.target.value)}
                    placeholder="예: 먹는다"
                  />
                </label>
                <label>
                  문장 부호
                  <select
                    value={customSentenceForm.punctuation}
                    onChange={(event) => handleCustomFormChange('punctuation', event.target.value)}
                  >
                    <option value=".">.</option>
                    <option value="?">?</option>
                    <option value="!">!</option>
                  </select>
                </label>
              </div>
              <p className="custom-form-message" aria-live="polite">
                {customFormMessage || ' '}
              </p>
            </form>

            {customPuzzles.length > 0 ? (
              <ul className="custom-sentence-list" aria-label="내 문장 목록">
                {customPuzzles.map((item) => (
                  <li key={item.id}>
                    <span>
                      <strong>{item.title}</strong>
                      {getSentenceText(item, item.answer)}
                    </span>
                    <button
                      className="icon-text-button"
                      type="button"
                      onClick={() => handleDeleteCustomPuzzle(item.id)}
                      aria-label={`${item.title} 삭제`}
                    >
                      <Trash2 aria-hidden="true" size={18} />
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <section className="lesson-finish" aria-labelledby="lesson-finish-title">
              <div className="lesson-finish-header">
                <div>
                  <p className="panel-kicker">수업 마무리</p>
                  <h3 id="lesson-finish-title">
                    <ClipboardCheck aria-hidden="true" size={22} />
                    결과 정리
                  </h3>
                </div>
                <div className="lesson-finish-actions">
                  <button
                    className="secondary-button copy-button"
                    type="button"
                    onClick={handleCopyResults}
                    disabled={lessonResultRows.length === 0}
                  >
                    <Copy aria-hidden="true" size={20} />
                    수업 결과 복사
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={handleDownloadCsv}
                    disabled={lessonResultRows.length === 0}
                  >
                    <FileDown aria-hidden="true" size={20} />
                    CSV 저장
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={handlePrintWorksheet}
                    disabled={activePuzzles.length === 0}
                  >
                    <Printer aria-hidden="true" size={20} />
                    활동지 인쇄
                  </button>
                </div>
              </div>
              <span className="copy-message" aria-live="polite">
                {copyMessage || '현재 문장 세트의 결과를 정리합니다.'}
              </span>
            </section>

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

            <section className="print-worksheet" aria-labelledby="worksheet-title">
              <div className="worksheet-header">
                <div>
                  <p className="panel-kicker">인쇄용 활동지</p>
                  <h3 id="worksheet-title">{activeLessonSet.label}</h3>
                </div>
                <div className="worksheet-lines" aria-label="학생 정보">
                  <span>이름</span>
                  <span>날짜</span>
                </div>
              </div>
              <ol className="worksheet-list">
                {activePuzzles.map((item) => (
                  <li key={item.id}>
                    <strong>{item.title}</strong>
                    <div className="worksheet-slots">
                      {item.slots.map((role, index) => (
                        <span key={`${item.id}-${role}-${index}`}>
                          <b>{roleLabels[role]}</b>
                          <i aria-hidden="true" />
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
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
              {allPuzzles.map((item) => {
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
              {allPuzzles.map((item) => (
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
