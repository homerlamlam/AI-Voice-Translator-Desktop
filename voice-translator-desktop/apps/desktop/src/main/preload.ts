import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktopApi', {
  ping: () => ipcRenderer.invoke('app:ping'),
});
