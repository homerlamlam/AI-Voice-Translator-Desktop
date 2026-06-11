import { describe, expect, it } from 'vitest';
import { SpeechStateMachine } from '../services/state/speechStateMachine';
import { VoiceTranslatorError } from '../types/errors';

describe('SpeechStateMachine', () => {
  it('allows the expected push-to-talk speech flow', () => {
    const machine = new SpeechStateMachine();

    expect(machine.transition('recording')).toBe('recording');
    expect(machine.transition('transcribing')).toBe('transcribing');
    expect(machine.transition('translating')).toBe('translating');
    expect(machine.transition('synthesizing')).toBe('synthesizing');
    expect(machine.transition('playing')).toBe('playing');
    expect(machine.transition('idle')).toBe('idle');
  });

  it('moves to error from any active stage', () => {
    const machine = new SpeechStateMachine('translating');

    expect(machine.transition('error')).toBe('error');
    expect(machine.transition('recording')).toBe('recording');
  });

  it('rejects invalid transitions', () => {
    const machine = new SpeechStateMachine();

    expect(() => machine.transition('translating')).toThrow(VoiceTranslatorError);
  });
});
