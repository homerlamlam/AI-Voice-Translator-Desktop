import type { RecorderEvents, RecorderState, RecordingResult } from '../../types/audio';
import { VoiceTranslatorError } from '../../types/errors';
import { requestMicrophoneAccess } from './inputDevices';

export class AudioRecorderService {
  private mediaRecorder?: MediaRecorder;
  private stream?: MediaStream;
  private chunks: BlobPart[] = [];
  private startedAt = 0;
  private durationTimer?: number;
  private volumeFrame?: number;
  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  private readonly events: RecorderEvents;

  state: RecorderState = 'idle';

  constructor(events: RecorderEvents = {}) {
    this.events = events;
  }

  async start(deviceId?: string): Promise<void> {
    if (this.state === 'recording') {
      return;
    }

    try {
      this.stream = await requestMicrophoneAccess(deviceId);
      this.assertLiveAudioTrack(this.stream);
      this.chunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        throw new VoiceTranslatorError('RECORDING_FAILED', 'Recording failed.', event);
      };

      this.startedAt = Date.now();
      this.state = 'recording';
      this.mediaRecorder.start();
      this.startDurationTimer();
      this.startVolumeMeter(this.stream);
    } catch (error) {
      this.cleanup();
      if (error instanceof VoiceTranslatorError) {
        throw error;
      }
      throw new VoiceTranslatorError('RECORDING_FAILED', 'Recording failed to start.', error);
    }
  }

  async stop(): Promise<RecordingResult> {
    if (!this.mediaRecorder || this.state !== 'recording') {
      throw new VoiceTranslatorError('RECORDING_FAILED', 'Recording is not active.');
    }

    const recorder = this.mediaRecorder;
    const mimeType = recorder.mimeType || 'audio/webm';
    const durationMs = Date.now() - this.startedAt;

    return await new Promise<RecordingResult>((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: mimeType });
        this.cleanup();
        resolve({ blob, mimeType, durationMs });
      };

      recorder.onerror = (event) => {
        this.cleanup();
        reject(new VoiceTranslatorError('RECORDING_FAILED', 'Recording failed to stop.', event));
      };

      try {
        recorder.stop();
      } catch (error) {
        this.cleanup();
        reject(new VoiceTranslatorError('RECORDING_FAILED', 'Recording failed to stop.', error));
      }
    });
  }

  dispose(): void {
    this.cleanup();
  }

  private assertLiveAudioTrack(stream: MediaStream): void {
    const hasLiveTrack = stream.getAudioTracks().some((track) => track.readyState === 'live');
    if (!hasLiveTrack) {
      throw new VoiceTranslatorError('MIC_DEVICE_NOT_FOUND', 'Selected microphone is not available.');
    }
  }

  private startDurationTimer(): void {
    this.events.onDuration?.(0);
    this.durationTimer = window.setInterval(() => {
      this.events.onDuration?.(Date.now() - this.startedAt);
    }, 100);
  }

  private startVolumeMeter(stream: MediaStream): void {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    this.audioContext = new AudioContextConstructor();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    const samples = new Uint8Array(this.analyser.frequencyBinCount);
    const tick = () => {
      if (!this.analyser || this.state !== 'recording') {
        return;
      }

      this.analyser.getByteTimeDomainData(samples);
      const peak =
        samples.reduce((max, sample) => Math.max(max, Math.abs(sample - 128)), 0) / 128;
      this.events.onVolume?.(Math.min(1, peak));
      this.volumeFrame = window.requestAnimationFrame(tick);
    };

    tick();
  }

  private cleanup(): void {
    this.state = 'idle';

    if (this.durationTimer) {
      window.clearInterval(this.durationTimer);
      this.durationTimer = undefined;
    }

    if (this.volumeFrame) {
      window.cancelAnimationFrame(this.volumeFrame);
      this.volumeFrame = undefined;
    }

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    this.mediaRecorder = undefined;
    this.audioContext?.close().catch(() => undefined);
    this.audioContext = undefined;
    this.analyser = undefined;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
