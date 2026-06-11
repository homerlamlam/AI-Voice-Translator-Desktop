import { ipcMain } from 'electron';
import { registerGlobalShortcuts } from './globalShortcut.js';
import { toAppError } from '../types/errors.js';
import { MainOpenAiSpeechProvider } from './openaiSpeechProvider.js';

export const registerIpcHandlers = () => {
  ipcMain.handle('app:ping', () => ({ ok: true }));
  ipcMain.handle('ptt:set-global-shortcut', (_event, accelerator: string) => {
    try {
      registerGlobalShortcuts(accelerator);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: toAppError(
          error,
          'HOTKEY_REGISTER_FAILED',
          'Failed to register push-to-talk shortcut.',
        ),
      };
    }
  });
  ipcMain.handle(
    'speech:openai-transcribe',
    async (_event, request: { audioData: ArrayBuffer; mimeType: string }) => {
      try {
        const provider = new MainOpenAiSpeechProvider();
        return { ok: true, result: await provider.transcribe(request.audioData, request.mimeType) };
      } catch (error) {
        return { ok: false, error: toAppError(error, 'ASR_FAILED', 'OpenAI transcription failed.') };
      }
    },
  );
  ipcMain.handle(
    'speech:openai-translate',
    async (_event, request: { text: string; targetLanguage: string }) => {
      try {
        const provider = new MainOpenAiSpeechProvider();
        return {
          ok: true,
          result: await provider.translate(request.text, request.targetLanguage),
        };
      } catch (error) {
        return {
          ok: false,
          error: toAppError(error, 'TRANSLATION_FAILED', 'OpenAI translation failed.'),
        };
      }
    },
  );
  ipcMain.handle('speech:openai-synthesize', async (_event, request: { text: string; voice: string }) => {
    try {
      const provider = new MainOpenAiSpeechProvider();
      return { ok: true, result: await provider.synthesize(request.text, request.voice) };
    } catch (error) {
      return { ok: false, error: toAppError(error, 'TTS_FAILED', 'OpenAI synthesis failed.') };
    }
  });
};
