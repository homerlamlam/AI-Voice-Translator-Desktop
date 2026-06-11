export interface AppSettings {
  inputDeviceId?: string;
  outputDeviceId?: string;
  speechProvider: 'mock' | 'openai';
  targetLanguage: string;
  voice: string;
}

const storageKey = 'voice-translator-settings';

export const defaultSettings: AppSettings = {
  speechProvider: 'mock',
  targetLanguage: 'en',
  voice: 'alloy',
};

export class SettingsStore {
  load(): AppSettings {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return defaultSettings;
    }

    return { ...defaultSettings, ...JSON.parse(raw) };
  }

  save(settings: AppSettings): void {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  }
}
