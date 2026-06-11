import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktopApi', {
  ping: () => ipcRenderer.invoke('app:ping'),
  openAiTranscribe: (request: { audioData: ArrayBuffer; mimeType: string }) =>
    ipcRenderer.invoke('speech:openai-transcribe', request),
  openAiTranslate: (request: { text: string; targetLanguage: string }) =>
    ipcRenderer.invoke('speech:openai-translate', request),
  openAiSynthesize: (request: { text: string; voice: string }) =>
    ipcRenderer.invoke('speech:openai-synthesize', request),
  setGlobalPushToTalkHotkey: (accelerator: string) =>
    ipcRenderer.invoke('ptt:set-global-shortcut', accelerator),
  onGlobalPushToTalkPressed: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('ptt:global-pressed', listener);
    return () => ipcRenderer.off('ptt:global-pressed', listener);
  },
});
