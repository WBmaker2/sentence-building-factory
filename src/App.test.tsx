import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import App from './App';

function createStorageMock(): Storage {
  let store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: vi.fn(() => {
      store = {};
    }),
    getItem: vi.fn((key: string) => store[key] ?? null),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
  };
}

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: createStorageMock(),
  });
  window.localStorage.clear();
});

async function placeBlock(user: ReturnType<typeof userEvent.setup>, text: string, slotLabel: RegExp) {
  await user.click(screen.getByRole('button', { name: `${text} 블록 선택` }));
  await user.click(screen.getByRole('button', { name: slotLabel }));
}

function readBlobAsText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
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

test('filters the student activity by the selected lesson sentence set', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '수업 진행' }));
  expect(screen.getByRole('heading', { name: '수업 진행' })).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText('오늘 문장 세트'), 'question');
  await user.click(screen.getByRole('button', { name: '학생 모드' }));

  expect(screen.getByText('1 / 2')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '물음표 문장' })).toBeInTheDocument();
});

test('lets the teacher choose random lesson progression', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '수업 진행' }));
  await user.selectOptions(screen.getByLabelText('진행 방식'), 'random');

  expect(screen.getByLabelText('진행 방식')).toHaveValue('random');
});

test('lets the teacher create and practice a custom sentence', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '수업 진행' }));
  await user.type(screen.getByLabelText('문장 이름'), '토끼 문장');
  await user.type(screen.getByLabelText('누가 카드'), '토끼가');
  await user.type(screen.getByLabelText('무엇을 카드'), '당근을');
  await user.type(screen.getByLabelText('어찌한다 카드'), '먹는다');
  await user.click(screen.getByRole('button', { name: '내 문장 추가' }));

  expect(screen.getByText('1 / 1')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '토끼 문장' })).toBeInTheDocument();

  await placeBlock(user, '토끼가', /1번 칸/);
  await placeBlock(user, '당근을', /2번 칸/);
  await placeBlock(user, '먹는다', /3번 칸/);
  await placeBlock(user, '.', /4번 칸/);
  await user.click(screen.getByRole('button', { name: '정답 확인' }));

  expect(screen.getByText('참 잘했어요!')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('토끼가 당근을 먹는다.');
});

test('restores custom sentences from local storage', async () => {
  window.localStorage.setItem(
    'sentence-factory-custom-puzzles-v1',
    JSON.stringify([
      {
        id: 'teacher-custom-saved',
        title: '저장 문장',
        prompt: '선생님이 만든 문장을 완성해요.',
        slots: ['subject', 'object', 'predicate', 'punctuation'],
        answer: [
          'teacher-custom-saved-subject',
          'teacher-custom-saved-object',
          'teacher-custom-saved-predicate',
          'teacher-custom-saved-period',
        ],
        feedback: '저장한 문장이 완성되었어요.',
        blocks: [
          { id: 'teacher-custom-saved-subject', text: '우리가', role: 'subject' },
          { id: 'teacher-custom-saved-subject-distractor', text: '강아지가', role: 'subject' },
          { id: 'teacher-custom-saved-object', text: '노래를', role: 'object' },
          { id: 'teacher-custom-saved-object-distractor', text: '책을', role: 'object' },
          { id: 'teacher-custom-saved-predicate', text: '부른다', role: 'predicate' },
          { id: 'teacher-custom-saved-predicate-distractor', text: '읽는다', role: 'predicate' },
          { id: 'teacher-custom-saved-period', text: '.', role: 'punctuation' },
          { id: 'teacher-custom-saved-question', text: '?', role: 'punctuation' },
        ],
      },
    ]),
  );

  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '수업 진행' }));
  await user.selectOptions(screen.getByLabelText('오늘 문장 세트'), 'custom');
  await user.click(screen.getByRole('button', { name: '학생 모드' }));

  expect(screen.getByRole('heading', { name: '저장 문장' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '우리가 블록 선택' })).toBeInTheDocument();
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

test('copies lesson results for the teacher', async () => {
  const originalClipboard = window.navigator.clipboard;
  const clipboard = originalClipboard ?? { writeText: async () => undefined };

  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: clipboard,
  });
  const writeText = vi.spyOn(window.navigator.clipboard!, 'writeText').mockResolvedValue(undefined);

  const user = userEvent.setup();
  render(<App />);

  await placeBlock(user, '강아지가', /1번 칸/);
  await placeBlock(user, '뼈다귀를', /2번 칸/);
  await placeBlock(user, '먹는다', /3번 칸/);
  await placeBlock(user, '.', /4번 칸/);
  await user.click(screen.getByRole('button', { name: '정답 확인' }));
  await user.click(screen.getByRole('button', { name: '수업 진행' }));

  expect(screen.getByText('강아지가 뼈다귀를 먹는다.')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('button', { name: '수업 결과 복사' })).toBeEnabled());

  await user.click(screen.getByRole('button', { name: '수업 결과 복사' }));

  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('문장 세트: 전체 문장 세트'));
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('완성: 1/12'));
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('[완료] 강아지 문장 - 강아지가 뼈다귀를 먹는다.'));
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('강아지가 뼈다귀를 먹는다.'));
  expect(screen.getByRole('status')).toHaveTextContent('수업 결과를 복사했어요.');

  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: originalClipboard,
  });
});

test('downloads lesson results as a csv file', async () => {
  const originalCreateObjectURL = window.URL.createObjectURL;
  const originalRevokeObjectURL = window.URL.revokeObjectURL;
  const createObjectURL = vi.fn((object: Blob | MediaSource) => {
    expect(object).toBeInstanceOf(Blob);
    return 'blob:lesson-results';
  });
  const revokeObjectURL = vi.fn();
  const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

  Object.defineProperty(window.URL, 'createObjectURL', {
    configurable: true,
    value: createObjectURL,
  });
  Object.defineProperty(window.URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeObjectURL,
  });

  const user = userEvent.setup();
  render(<App />);

  await placeBlock(user, '강아지가', /1번 칸/);
  await placeBlock(user, '뼈다귀를', /2번 칸/);
  await placeBlock(user, '먹는다', /3번 칸/);
  await placeBlock(user, '.', /4번 칸/);
  await user.click(screen.getByRole('button', { name: '정답 확인' }));
  await user.click(screen.getByRole('button', { name: '수업 진행' }));
  await user.click(screen.getByRole('button', { name: 'CSV 저장' }));

  expect(createObjectURL).toHaveBeenCalledTimes(1);
  const csvBlob = createObjectURL.mock.calls[0][0] as Blob;
  const csvText = await readBlobAsText(csvBlob);

  expect(csvText).toContain('문장 세트,문장 이름,완성 문장,문장 부호,완료 여부');
  expect(csvText).toContain('전체 문장 세트,강아지 문장,강아지가 뼈다귀를 먹는다.,.,완료');
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:lesson-results');
  expect(screen.getByRole('status')).toHaveTextContent('CSV 파일을 만들었어요.');

  anchorClick.mockRestore();
  Object.defineProperty(window.URL, 'createObjectURL', {
    configurable: true,
    value: originalCreateObjectURL,
  });
  Object.defineProperty(window.URL, 'revokeObjectURL', {
    configurable: true,
    value: originalRevokeObjectURL,
  });
});

test('opens the print dialog for the worksheet', async () => {
  const originalPrint = window.print;
  const print = vi.fn();

  Object.defineProperty(window, 'print', {
    configurable: true,
    value: print,
  });

  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '수업 진행' }));
  expect(screen.getByText('인쇄용 활동지')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '활동지 인쇄' }));

  expect(print).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('heading', { name: '전체 문장 세트' })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('인쇄 창을 열었어요.');

  Object.defineProperty(window, 'print', {
    configurable: true,
    value: originalPrint,
  });
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
