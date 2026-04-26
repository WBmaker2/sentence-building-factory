import { defineConfig, mergeConfig } from 'vite';
import react from '@vitejs/plugin-react';

const vitestConfig = {
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
};

export default mergeConfig(defineConfig({
  base: '/sentence-building-factory/',
  plugins: [react()],
}), vitestConfig);
