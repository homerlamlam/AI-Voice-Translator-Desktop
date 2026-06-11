import { describe, expect, it } from 'vitest';
import {
  matchesPushToTalkStart,
  matchesPushToTalkStop,
  normalizePushToTalkHotkey,
} from '../services/hotkeys/pushToTalkHotkey';

describe('push-to-talk hotkey matching', () => {
  it('matches the default Alt+Space press and release', () => {
    expect(
      matchesPushToTalkStart(
        { altKey: true, ctrlKey: false, code: 'Space', repeat: false },
        'Alt+Space',
      ),
    ).toBe(true);
    expect(matchesPushToTalkStop({ code: 'Space' }, 'Alt+Space')).toBe(true);
  });

  it('ignores key repeat events', () => {
    expect(
      matchesPushToTalkStart(
        { altKey: true, ctrlKey: false, code: 'Space', repeat: true },
        'Alt+Space',
      ),
    ).toBe(false);
  });

  it('falls back to Alt+Space for unsupported values', () => {
    expect(normalizePushToTalkHotkey('Shift+Space')).toBe('Alt+Space');
  });
});
