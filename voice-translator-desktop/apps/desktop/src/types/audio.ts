export interface AudioDeviceOption {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  durationMs: number;
}

export interface RecorderEvents {
  onDuration?: (durationMs: number) => void;
  onVolume?: (volume: number) => void;
}

export type RecorderState = 'idle' | 'recording';
