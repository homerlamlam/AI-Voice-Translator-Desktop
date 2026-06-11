import { create } from 'zustand';
import type { AppError } from '../../types/errors';
import type { LogEntry, AppStatus } from '../../types/status';
import { createLogEntry } from '../../services/logging/logger';

interface AppStoreState {
  status: AppStatus;
  sourceText: string;
  translatedText: string;
  error?: AppError;
  logs: LogEntry[];
  setStatus: (status: AppStatus) => void;
  setTexts: (sourceText: string, translatedText: string) => void;
  setError: (error?: AppError) => void;
  addLog: (message: string) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  status: 'idle',
  sourceText: '',
  translatedText: '',
  logs: [],
  setStatus: (status) =>
    set((state) => ({
      status,
      logs: [createLogEntry(`status changed: ${status}`), ...state.logs],
    })),
  setTexts: (sourceText, translatedText) => set({ sourceText, translatedText }),
  setError: (error) => set({ error }),
  addLog: (message) =>
    set((state) => ({
      logs: [createLogEntry(message), ...state.logs],
    })),
}));
