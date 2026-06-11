import type { AppStatus } from '../../types/status';
import { VoiceTranslatorError } from '../../types/errors';

const transitions: Record<AppStatus, AppStatus[]> = {
  idle: ['recording', 'playing', 'error'],
  recording: ['transcribing', 'idle', 'error'],
  transcribing: ['translating', 'error'],
  translating: ['synthesizing', 'error'],
  synthesizing: ['playing', 'error'],
  playing: ['idle', 'error'],
  error: ['idle', 'recording'],
};

export class SpeechStateMachine {
  private currentStatus: AppStatus;

  constructor(initialStatus: AppStatus = 'idle') {
    this.currentStatus = initialStatus;
  }

  get status() {
    return this.currentStatus;
  }

  canTransition(nextStatus: AppStatus) {
    return transitions[this.currentStatus].includes(nextStatus);
  }

  transition(nextStatus: AppStatus) {
    if (!this.canTransition(nextStatus)) {
      throw new VoiceTranslatorError(
        'RECORDING_FAILED',
        `Invalid speech state transition: ${this.currentStatus} -> ${nextStatus}`,
      );
    }

    this.currentStatus = nextStatus;
    return this.currentStatus;
  }

  reset() {
    this.currentStatus = 'idle';
  }
}
