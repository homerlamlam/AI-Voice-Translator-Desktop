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
  if (error instanceof VoiceTranslatorError) {
    return { code: error.code, message: error.message, cause: error.cause };
  }

  if (error instanceof Error) {
    return { code: fallbackCode, message: error.message || fallbackMessage, cause: error };
  }

  return { code: fallbackCode, message: fallbackMessage, cause: error };
};
