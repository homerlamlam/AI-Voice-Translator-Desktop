export type AppErrorCode =
  | 'MIC_PERMISSION_DENIED'
  | 'MIC_DEVICE_NOT_FOUND'
  | 'RECORDING_FAILED'
  | 'ASR_FAILED'
  | 'TRANSLATION_FAILED'
  | 'TTS_FAILED'
  | 'AUDIO_OUTPUT_FAILED'
  | 'HOTKEY_REGISTER_FAILED'
  | 'CONFIG_LOAD_FAILED';

export interface AppError {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
}

export class VoiceTranslatorError extends Error implements AppError {
  readonly code: AppErrorCode;
  readonly cause?: unknown;

  constructor(code: AppErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'VoiceTranslatorError';
    this.code = code;
    this.cause = cause;
  }
}

export const toAppError = (
  error: unknown,
  fallbackCode: AppErrorCode,
  fallbackMessage: string,
): AppError => {
  if (isAppError(error)) {
    return { ...error, message: redactSecrets(error.message) };
  }

  if (error instanceof VoiceTranslatorError) {
    return { code: error.code, message: redactSecrets(error.message), cause: error.cause };
  }

  if (error instanceof Error) {
    return {
      code: fallbackCode,
      message: redactSecrets(error.message || fallbackMessage),
      cause: error,
    };
  }

  return { code: fallbackCode, message: redactSecrets(fallbackMessage), cause: error };
};

export const isAppError = (error: unknown): error is AppError => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as Partial<AppError>;
  return typeof candidate.code === 'string' && typeof candidate.message === 'string';
};

export const redactSecrets = (message: string): string =>
  message.replace(/sk-[A-Za-z0-9_-]{12,}/g, '[REDACTED_API_KEY]');
