export const supportedPushToTalkHotkeys = ['Alt+Space', 'Control+Space', 'Alt+KeyT'] as const;

export type PushToTalkHotkey = (typeof supportedPushToTalkHotkeys)[number];

export const isSupportedPushToTalkHotkey = (value: string): value is PushToTalkHotkey =>
  supportedPushToTalkHotkeys.includes(value as PushToTalkHotkey);

export const normalizePushToTalkHotkey = (value: string): PushToTalkHotkey =>
  isSupportedPushToTalkHotkey(value) ? value : 'Alt+Space';

export const matchesPushToTalkStart = (
  event: Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'code' | 'repeat'>,
  hotkey: string,
) => {
  if (event.repeat) {
    return false;
  }

  switch (normalizePushToTalkHotkey(hotkey)) {
    case 'Alt+Space':
      return event.altKey && !event.ctrlKey && event.code === 'Space';
    case 'Control+Space':
      return event.ctrlKey && !event.altKey && event.code === 'Space';
    case 'Alt+KeyT':
      return event.altKey && !event.ctrlKey && event.code === 'KeyT';
  }
};

export const matchesPushToTalkStop = (
  event: Pick<KeyboardEvent, 'code'>,
  hotkey: string,
) => {
  switch (normalizePushToTalkHotkey(hotkey)) {
    case 'Alt+Space':
    case 'Control+Space':
      return event.code === 'Space';
    case 'Alt+KeyT':
      return event.code === 'KeyT';
  }
};
