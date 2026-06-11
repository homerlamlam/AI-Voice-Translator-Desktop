import { BrowserWindow, globalShortcut } from 'electron';
import { VoiceTranslatorError } from '../types/errors.js';

export const registerGlobalShortcuts = (accelerator = 'Alt+Space') => {
  const electronAccelerator = toElectronAccelerator(accelerator);
  globalShortcut.unregisterAll();

  const registered = globalShortcut.register(electronAccelerator, () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('ptt:global-pressed');
    });
  });

  if (!registered) {
    throw new VoiceTranslatorError(
      'HOTKEY_REGISTER_FAILED',
      `Failed to register global shortcut: ${electronAccelerator}`,
    );
  }
};

export const unregisterGlobalShortcuts = () => {
  globalShortcut.unregisterAll();
};

const toElectronAccelerator = (hotkey: string) => hotkey.replace('Key', '');
