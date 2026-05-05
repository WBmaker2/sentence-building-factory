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

  test('formats exclamation marks without an extra space', () => {
    const excitedPuzzle: SentencePuzzle = {
      ...puzzle,
      answer: ['dog-subject', 'bone-object', 'eat-predicate', 'exclamation'],
      blocks: [
        ...puzzle.blocks,
        { id: 'exclamation', text: '!', role: 'punctuation' },
      ],
    };

    const result = evaluateSentence(excitedPuzzle, ['dog-subject', 'bone-object', 'eat-predicate', 'exclamation']);

    expect(result.sentenceText).toBe('강아지가 뼈다귀를 먹는다!');
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
