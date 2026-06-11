import { ipcMain } from 'electron';
import { registerGlobalShortcuts } from './globalShortcut.js';
import { toAppError } from '../types/errors.js';

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
};
