import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the app title', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: '뚝딱뚝딱 문장 만들기 공장' })).toBeInTheDocument();
});
