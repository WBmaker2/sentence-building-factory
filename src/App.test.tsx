import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from './App';

async function placeBlock(user: ReturnType<typeof userEvent.setup>, text: string, slotLabel: RegExp) {
  await user.click(screen.getByRole('button', { name: `${text} 블록 선택` }));
  await user.click(screen.getByRole('button', { name: slotLabel }));
}

test('builds a correct sentence and moves to the next puzzle', async () => {
  const user = userEvent.setup();
  render(<App />);

  await placeBlock(user, '강아지가', /1번 칸/);
  await placeBlock(user, '뼈다귀를', /2번 칸/);
  await placeBlock(user, '먹는다', /3번 칸/);
  await placeBlock(user, '.', /4번 칸/);
  await user.click(screen.getByRole('button', { name: '정답 확인' }));

  expect(screen.getByText('참 잘했어요!')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('강아지가 뼈다귀를 먹는다.');

  await user.click(screen.getByRole('button', { name: '다음 문장' }));
  expect(screen.getByRole('heading', { name: '나비 문장' })).toBeInTheDocument();
});

test('shows punctuation feedback when the sentence mark is wrong', async () => {
  const user = userEvent.setup();
  render(<App />);

  await placeBlock(user, '강아지가', /1번 칸/);
  await placeBlock(user, '뼈다귀를', /2번 칸/);
  await placeBlock(user, '먹는다', /3번 칸/);
  await placeBlock(user, '?', /4번 칸/);
  await user.click(screen.getByRole('button', { name: '정답 확인' }));

  expect(screen.getByText('문장 부호를 다시 살펴봐요.')).toBeInTheDocument();
});

test('lets the teacher choose a different puzzle', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.selectOptions(screen.getByLabelText('문장 단계 선택'), 'help-friend-question');
  expect(screen.getByRole('heading', { name: '물음표 문장' })).toBeInTheDocument();
});

test('switches between student, progress, and example views', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '진행 현황' }));
  expect(screen.getByRole('heading', { name: '진행 현황' })).toBeInTheDocument();
  expect(screen.getByText('완성한 문장 0개')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '문장 예시' }));
  expect(screen.getByRole('heading', { name: '문장 예시' })).toBeInTheDocument();
  expect(screen.getByText('강아지가 뼈다귀를 먹는다.')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '학생 모드' }));
  expect(screen.getByRole('heading', { name: '강아지 문장' })).toBeInTheDocument();
});

test('records progress after a correct sentence', async () => {
  const user = userEvent.setup();
  render(<App />);

  await placeBlock(user, '강아지가', /1번 칸/);
  await placeBlock(user, '뼈다귀를', /2번 칸/);
  await placeBlock(user, '먹는다', /3번 칸/);
  await placeBlock(user, '.', /4번 칸/);
  await user.click(screen.getByRole('button', { name: '정답 확인' }));
  await user.click(screen.getByRole('button', { name: '진행 현황' }));

  expect(screen.getByText('완성한 문장 1개')).toBeInTheDocument();
  expect(screen.getByText('강아지 문장 완료')).toBeInTheDocument();
});

test('reads the assembled sentence aloud when speech synthesis is available', async () => {
  const speak = vi.fn();
  const cancel = vi.fn();
  const originalSpeechSynthesis = window.speechSynthesis;

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: { cancel, speak },
  });

  class MockSpeechSynthesisUtterance {
    lang = '';
    text: string;

    constructor(text: string) {
      this.text = text;
    }
  }

  vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);

  const user = userEvent.setup();
  render(<App />);

  await placeBlock(user, '강아지가', /1번 칸/);
  await placeBlock(user, '뼈다귀를', /2번 칸/);
  await placeBlock(user, '먹는다', /3번 칸/);
  await placeBlock(user, '.', /4번 칸/);
  await user.click(screen.getByRole('button', { name: '읽어 주기' }));

  expect(cancel).toHaveBeenCalled();
  expect(speak).toHaveBeenCalledWith(
    expect.objectContaining({
      lang: 'ko-KR',
      text: '강아지가 뼈다귀를 먹는다.',
    }),
  );

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: originalSpeechSynthesis,
  });
  vi.unstubAllGlobals();
});
