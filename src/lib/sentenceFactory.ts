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
