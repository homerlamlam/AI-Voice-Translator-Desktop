import type { LogEntry } from '../../types/status';
import type { AppError } from '../../types/errors';
import type { AppStatus } from '../../types/status';

export const createLogEntry = (message: string, level: LogEntry['level'] = 'info'): LogEntry => {
  const now = new Date();
  return {
    id: `${now.getTime()}-${Math.random().toString(16).slice(2)}`,
    time: now.toLocaleTimeString([], { hour12: false }),
    level,
    message,
  };
};

export class AppLogger {
  info(message: string): LogEntry {
    return createLogEntry(message, 'info');
  }

  error(error: AppError): LogEntry {
    return createLogEntry(`${error.code}: ${error.message}`, 'error');
  }

  stateChanged(status: AppStatus): LogEntry {
    return createLogEntry(`status changed: ${status}`, status === 'error' ? 'error' : 'info');
  }
}
