/// <reference types="vite/client" />

declare module 'react' {
  const React: {
    StrictMode: typeof import('react').Fragment;
  };

  export default React;
}

declare module 'react-dom/client' {
  export interface Root {
    render(children: import('react').ReactNode): void;
    unmount(): void;
  }

  export function createRoot(container: Element | DocumentFragment): Root;
}

declare module 'react/jsx-runtime' {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unique symbol;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: unknown;
  }
}

declare const test: (name: string, fn: () => void) => void;
declare const expect: (actual: unknown) => {
  toBeInTheDocument: () => void;
};
