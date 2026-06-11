import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioRecorderService } from '../services/audio/recorder';
import { VoiceTranslatorError } from '../types/errors';
import { requestMicrophoneAccess } from '../services/audio/inputDevices';

vi.mock('../services/audio/inputDevices', () => ({
  requestMicrophoneAccess: vi.fn(),
}));

class MockMediaRecorder extends EventTarget {
  static instances: MockMediaRecorder[] = [];
  mimeType = 'audio/webm';
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public stream: MediaStream) {
    super();
    MockMediaRecorder.instances.push(this);
  }

  start() {
    this.ondataavailable?.({ data: new Blob(['audio'], { type: this.mimeType }) } as BlobEvent);
  }

  stop() {
    this.onstop?.();
  }
}

const createStream = () =>
  ({
    getAudioTracks: () => [{ readyState: 'live' }],
    getTracks: () => [{ stop: vi.fn() }],
  }) as unknown as MediaStream;

describe('AudioRecorderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockMediaRecorder.instances = [];
    vi.stubGlobal('MediaRecorder', MockMediaRecorder);
    vi.mocked(requestMicrophoneAccess).mockResolvedValue(createStream());
  });

  it('starts and stops recording with a blob result', async () => {
    const durations: number[] = [];
    const recorder = new AudioRecorderService({ onDuration: (value) => durations.push(value) });

    await recorder.start('mic-1');
    expect(recorder.state).toBe('recording');

    const result = await recorder.stop();

    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.mimeType).toBe('audio/webm');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(recorder.state).toBe('idle');
    expect(durations[0]).toBe(0);
    expect(requestMicrophoneAccess).toHaveBeenCalledWith('mic-1');
  });

  it('maps microphone permission failures', async () => {
    vi.mocked(requestMicrophoneAccess).mockRejectedValue(
      new VoiceTranslatorError('MIC_PERMISSION_DENIED', 'Microphone permission was denied.'),
    );
    const recorder = new AudioRecorderService();

    await expect(recorder.start()).rejects.toMatchObject({
      code: 'MIC_PERMISSION_DENIED',
    });
  });

  it('maps missing live audio tracks to MIC_DEVICE_NOT_FOUND', async () => {
    vi.mocked(requestMicrophoneAccess).mockResolvedValue({
      getAudioTracks: () => [],
      getTracks: () => [],
    } as unknown as MediaStream);
    const recorder = new AudioRecorderService();

    await expect(recorder.start()).rejects.toMatchObject({
      code: 'MIC_DEVICE_NOT_FOUND',
    });
  });

  it('rejects stop when recording is inactive', async () => {
    const recorder = new AudioRecorderService();

    await expect(recorder.stop()).rejects.toMatchObject({
      code: 'RECORDING_FAILED',
    });
  });
});
