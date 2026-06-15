import type { PlaybackRequest, PlaybackState } from '../../types/audio';
import { VoiceTranslatorError } from '../../types/errors';

type SinkableAudioElement = HTMLAudioElement & {
  setSinkId?: (sinkId: string) => Promise<void>;
};

export class AudioPlayerService {
  private audio?: SinkableAudioElement;
  private objectUrl?: string;
  private finishPlayback?: () => void;

  state: PlaybackState = 'idle';

  async play(request: PlaybackRequest): Promise<void> {
    this.stop();

    try {
      const audio = new Audio() as SinkableAudioElement;
      this.audio = audio;
      this.state = 'playing';
      const sourceDescription = describeSource(request.source);

      if (request.outputDeviceId && audio.setSinkId) {
        await audio.setSinkId(request.outputDeviceId);
      }

      audio.src = this.resolveSource(request.source);
      const finished = new Promise<void>((resolve, reject) => {
        this.finishPlayback = resolve;
        audio.onended = () => {
          this.cleanup();
          resolve();
        };
        audio.onerror = () => {
          this.cleanup();
          reject(
            new VoiceTranslatorError(
              'AUDIO_OUTPUT_FAILED',
              `Audio element failed to play source: ${sourceDescription}.`,
            ),
          );
        };
      });

      await audio.play();
      await finished;
    } catch (error) {
      this.stop();
      throw new VoiceTranslatorError(
        'AUDIO_OUTPUT_FAILED',
        `Failed to play audio output: ${error instanceof Error ? error.message : 'Unknown error.'}`,
        error,
      );
    }
  }

  stop(): void {
    this.finishPlayback?.();
    this.finishPlayback = undefined;
    this.cleanup();
  }

  private cleanup(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.removeAttribute('src');
      this.audio.load();
      this.audio = undefined;
    }

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }

    this.state = 'idle';
  }

  supportsOutputDeviceSelection(): boolean {
    return typeof Audio !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
  }

  createTestTone(durationMs = 700): Blob {
    const sampleRate = 44100;
    const frequency = 880;
    const sampleCount = Math.floor((sampleRate * durationMs) / 1000);
    const bytesPerSample = 2;
    const dataSize = sampleCount * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeAscii(view, 8, 'WAVE');
    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 8 * bytesPerSample, true);
    writeAscii(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    for (let index = 0; index < sampleCount; index += 1) {
      const fade = Math.min(index / 1000, (sampleCount - index) / 1000, 1);
      const sample = Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 0.25 * fade;
      view.setInt16(44 + index * bytesPerSample, sample * 0x7fff, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  private resolveSource(source: string | Blob): string {
    if (source instanceof Blob) {
      this.objectUrl = URL.createObjectURL(source);
      return this.objectUrl;
    }

    return source;
  }
}

const writeAscii = (view: DataView, offset: number, text: string): void => {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
};

const describeSource = (source: string | Blob): string => {
  if (source instanceof Blob) {
    return source.type || 'blob';
  }

  if (source.startsWith('data:')) {
    return source.slice(0, source.indexOf(';') > 0 ? source.indexOf(';') : 32);
  }

  if (source.startsWith('file:')) {
    return 'file URL';
  }

  return 'URL';
};
