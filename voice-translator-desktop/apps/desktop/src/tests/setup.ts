import { vi } from 'vitest';

Object.defineProperty(window, 'requestAnimationFrame', {
  value: (callback: FrameRequestCallback) => window.setTimeout(callback, 16),
  writable: true,
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: (id: number) => window.clearTimeout(id),
  writable: true,
});

Object.defineProperty(globalThis, 'URL', {
  value: {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock-audio'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});
