/// <reference types="vite/client" />

interface Window {
  desktopApi?: {
    ping: () => Promise<{ ok: boolean }>;
  };
}
