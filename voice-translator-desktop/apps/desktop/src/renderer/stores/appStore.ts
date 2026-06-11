import { create } from 'zustand';
import type { AppError } from '../../types/errors';
import type { LogEntry, AppStatus } from '../../types/status';
import { AppLogger } from '../../services/logging/logger';

const logger = new AppLogger();

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
  addErrorLog: (error: AppError) => void;
  clearError: () => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  status: 'idle',
  sourceText: '',
  translatedText: '',
  logs: [],
  setStatus: (status) =>
    set((state) => ({
      status,
      logs: [logger.stateChanged(status), ...state.logs],
    })),
  setTexts: (sourceText, translatedText) => set({ sourceText, translatedText }),
  setError: (error) => set({ error }),
  addLog: (message) =>
    set((state) => ({
      logs: [logger.info(message), ...state.logs],
    })),
  addErrorLog: (error) =>
    set((state) => ({
      logs: [logger.error(error), ...state.logs],
    })),
  clearError: () => set({ error: undefined }),
}));
