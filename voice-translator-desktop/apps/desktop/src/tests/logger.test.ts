import { describe, expect, it } from 'vitest';
import { AppLogger } from '../services/logging/logger';

describe('AppLogger', () => {
  it('creates info logs', () => {
    const logger = new AppLogger();

    const entry = logger.info('recording started');

    expect(entry.level).toBe('info');
    expect(entry.message).toBe('recording started');
    expect(entry.time).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('creates error logs from app errors', () => {
    const logger = new AppLogger();

    const entry = logger.error({ code: 'ASR_FAILED', message: 'ASR failed.' });

    expect(entry.level).toBe('error');
    expect(entry.message).toBe('ASR_FAILED: ASR failed.');
  });

  it('marks error state transitions as error logs', () => {
    const logger = new AppLogger();

    expect(logger.stateChanged('error').level).toBe('error');
    expect(logger.stateChanged('recording').level).toBe('info');
  });
});
