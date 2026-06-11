import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioPlayerService } from '../services/audio/player';

class MockAudioElement {
  static instances: MockAudioElement[] = [];
  src = '';
  currentTime = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  setSinkId = vi.fn(async (_sinkId: string) => undefined);
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn();

  constructor() {
    MockAudioElement.instances.push(this);
  }

  async play() {
    window.setTimeout(() => this.onended?.(), 0);
  }
}

describe('AudioPlayerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockAudioElement.instances = [];
    vi.stubGlobal('Audio', MockAudioElement);
  });

  it('plays a blob to a selected output device', async () => {
    const player = new AudioPlayerService();

    await player.play({
      source: new Blob(['audio'], { type: 'audio/wav' }),
      outputDeviceId: 'speaker-1',
    });

    const audio = MockAudioElement.instances[0];
    expect(audio.setSinkId).toHaveBeenCalledWith('speaker-1');
    expect(audio.pause).toHaveBeenCalled();
    expect(player.state).toBe('idle');
  });

  it('can stop playback', async () => {
    class LongAudioElement extends MockAudioElement {
      override async play() {
        return undefined;
      }
    }
    vi.stubGlobal('Audio', LongAudioElement);
    const player = new AudioPlayerService();
    const playPromise = player.play({ source: '/test.wav' });

    expect(player.state).toBe('playing');
    player.stop();
    await playPromise;

    expect(player.state).toBe('idle');
  });

  it('creates a wav test tone', () => {
    const player = new AudioPlayerService();

    const tone = player.createTestTone();

    expect(tone.type).toBe('audio/wav');
    expect(tone.size).toBeGreaterThan(44);
  });
});
