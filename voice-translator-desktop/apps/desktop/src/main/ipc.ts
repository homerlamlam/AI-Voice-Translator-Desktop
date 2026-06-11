import { ipcMain } from 'electron';

export const registerIpcHandlers = () => {
  ipcMain.handle('app:ping', () => ({ ok: true }));
};
