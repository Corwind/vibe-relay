import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver for components that use it (e.g., radix-ui ScrollArea)
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
