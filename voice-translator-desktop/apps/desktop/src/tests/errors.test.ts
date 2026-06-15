import { describe, expect, it } from 'vitest';
import { redactSecrets, toAppError, VoiceTranslatorError } from '../types/errors';

describe('error helpers', () => {
  it('preserves VoiceTranslatorError codes', () => {
    const error = toAppError(
      new VoiceTranslatorError('MIC_PERMISSION_DENIED', 'Denied.'),
      'RECORDING_FAILED',
      'Fallback.',
    );

    expect(error.code).toBe('MIC_PERMISSION_DENIED');
    expect(error.message).toBe('Denied.');
  });

  it('preserves AppError-shaped objects', () => {
    const error = toAppError(
      { code: 'TTS_FAILED' as const, message: 'TTS unavailable.' },
      'ASR_FAILED',
      'Fallback.',
    );

    expect(error.code).toBe('TTS_FAILED');
    expect(error.message).toBe('TTS unavailable.');
  });

  it('maps generic errors to fallback codes', () => {
    const error = toAppError(new Error('Generic.'), 'AUDIO_OUTPUT_FAILED', 'Fallback.');

    expect(error.code).toBe('AUDIO_OUTPUT_FAILED');
    expect(error.message).toBe('Generic.');
  });

  it('redacts API keys from error messages', () => {
    const error = toAppError(
      new Error('Request failed for sk-secretKeyValue123456'),
      'CONFIG_LOAD_FAILED',
      'Fallback.',
    );

    expect(error.message).toBe('Request failed for [REDACTED_API_KEY]');
  });

  it('redacts API keys from arbitrary text', () => {
    expect(redactSecrets('token sk-anotherSecretValue123456 failed')).toBe(
      'token [REDACTED_API_KEY] failed',
    );
  });
});
