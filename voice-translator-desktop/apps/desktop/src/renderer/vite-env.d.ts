/// <reference types="vite/client" />

interface Window {
  desktopApi?: {
    ping: () => Promise<{ ok: boolean }>;
    setGlobalPushToTalkHotkey: (
      accelerator: string,
    ) => Promise<{ ok: true } | { ok: false; error: import('../types/errors').AppError }>;
    onGlobalPushToTalkPressed: (callback: () => void) => () => void;
  };
}
