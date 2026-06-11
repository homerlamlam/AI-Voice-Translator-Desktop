import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktopApi', {
  ping: () => ipcRenderer.invoke('app:ping'),
  setGlobalPushToTalkHotkey: (accelerator: string) =>
    ipcRenderer.invoke('ptt:set-global-shortcut', accelerator),
  onGlobalPushToTalkPressed: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('ptt:global-pressed', listener);
    return () => ipcRenderer.off('ptt:global-pressed', listener);
  },
});
