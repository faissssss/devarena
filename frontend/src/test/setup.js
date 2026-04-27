import '@testing-library/jest-dom';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

globalThis.fetch = async (input) => {
  if (String(input).includes('/api/competitions/platforms')) {
    return {
      ok: true,
      async json() {
        return { platforms: ['kaggle', 'codeforces', 'leetcode'] };
      },
    };
  }

  throw new Error(`Unhandled fetch request in tests: ${String(input)}`);
};
