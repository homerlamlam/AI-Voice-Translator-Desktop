import { globalShortcut } from 'electron';

export const registerGlobalShortcuts = () => {
  // Push-to-talk is implemented in task 5. This file reserves the main-process boundary.
};

export const unregisterGlobalShortcuts = () => {
  globalShortcut.unregisterAll();
};
