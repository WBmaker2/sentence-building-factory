/// <reference types="vite/client" />

declare module 'react' {
  export type DragEvent<T = Element> = {
    currentTarget: T;
    dataTransfer: DataTransfer;
    preventDefault(): void;
  };

  export type ReactNode = unknown;

  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useState<T>(initialState: T | (() => T)): [
    T,
    (nextState: T | ((currentState: T) => T)) => void,
  ];

  const React: {
    StrictMode: (props: { children?: ReactNode }) => unknown;
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

declare const test: (name: string, fn: () => void | Promise<void>) => void;
declare const expect: (actual: unknown) => {
  toBeInTheDocument: () => void;
  toHaveTextContent: (text: string | RegExp) => void;
};
