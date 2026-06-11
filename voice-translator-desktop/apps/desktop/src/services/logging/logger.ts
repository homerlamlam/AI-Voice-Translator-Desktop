import type { LogEntry } from '../../types/status';

export const createLogEntry = (message: string): LogEntry => {
  const now = new Date();
  return {
    id: `${now.getTime()}-${Math.random().toString(16).slice(2)}`,
    time: now.toLocaleTimeString([], { hour12: false }),
    message,
  };
};
