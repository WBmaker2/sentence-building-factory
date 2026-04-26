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
