/// <reference types="vite/client" />

import type {
  SynthesisResult,
  TranscriptionResult,
  TranslationResult,
} from '../types/speech';

type DesktopApiResponse<T> =
  | { ok: true; result: T }
  | { ok: false; error: import('../types/errors').AppError };

declare global {
  interface Window {
    desktopApi?: {
      ping: () => Promise<{ ok: boolean }>;
      openAiTranscribe: (request: {
        audioData: ArrayBuffer;
        mimeType: string;
      }) => Promise<DesktopApiResponse<TranscriptionResult>>;
      openAiTranslate: (request: {
        text: string;
        targetLanguage: string;
      }) => Promise<DesktopApiResponse<TranslationResult>>;
      openAiSynthesize: (request: {
        text: string;
        voice: string;
      }) => Promise<DesktopApiResponse<SynthesisResult>>;
      setGlobalPushToTalkHotkey: (
        accelerator: string,
      ) => Promise<{ ok: true } | { ok: false; error: import('../types/errors').AppError }>;
      onGlobalPushToTalkPressed: (callback: () => void) => () => void;
    };
  }
}

export {};
