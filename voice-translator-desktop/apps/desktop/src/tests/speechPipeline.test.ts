import { describe, expect, it } from 'vitest';
import { SpeechPipeline } from '../services/speech/speechPipeline';
import { MockSpeechProvider } from '../services/speech/providers/mockProvider';
import { VoiceTranslatorError } from '../types/errors';
import type {
  SpeechProvider,
  SynthesisResult,
  TranscriptionResult,
  TranslationResult,
} from '../types/speech';

describe('SpeechPipeline', () => {
  it('runs the mock ASR, translation, and TTS flow', async () => {
    const pipeline = new SpeechPipeline(new MockSpeechProvider());

    const response = await pipeline.run(new Blob(['audio']));

    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.result.sourceText).toBe('我想确认一下明天的会议时间');
      expect(response.result.translatedText).toBe("I'd like to confirm tomorrow's meeting time.");
      expect(response.result.audioOutputPath).toBe('/mock-audio/tts-confirm-meeting.wav');
    }
  });

  it('returns ASR failures with an explicit error code', async () => {
    const pipeline = new SpeechPipeline(new FailingProvider('transcribe'));

    const response = await pipeline.run(new Blob(['audio']));

    expect(response.ok).toBe(false);
    if (!response.ok) {
      expect(response.error.code).toBe('ASR_FAILED');
    }
  });

  it('returns translation failures with an explicit error code', async () => {
    const pipeline = new SpeechPipeline(new FailingProvider('translate'));

    const response = await pipeline.run(new Blob(['audio']));

    expect(response.ok).toBe(false);
    if (!response.ok) {
      expect(response.error.code).toBe('TRANSLATION_FAILED');
    }
  });

  it('returns TTS failures with an explicit error code', async () => {
    const pipeline = new SpeechPipeline(new FailingProvider('synthesize'));

    const response = await pipeline.run(new Blob(['audio']));

    expect(response.ok).toBe(false);
    if (!response.ok) {
      expect(response.error.code).toBe('TTS_FAILED');
    }
  });
});

class FailingProvider implements SpeechProvider {
  constructor(private readonly stage: 'transcribe' | 'translate' | 'synthesize') {}

  async transcribe(): Promise<TranscriptionResult> {
    if (this.stage === 'transcribe') {
      throw new VoiceTranslatorError('ASR_FAILED', 'ASR failed.');
    }
    return { sourceText: '你好', language: 'zh-CN' };
  }

  async translate(): Promise<TranslationResult> {
    if (this.stage === 'translate') {
      throw new VoiceTranslatorError('TRANSLATION_FAILED', 'Translation failed.');
    }
    return { translatedText: 'Hello', targetLanguage: 'en' };
  }

  async synthesize(): Promise<SynthesisResult> {
    if (this.stage === 'synthesize') {
      throw new VoiceTranslatorError('TTS_FAILED', 'TTS failed.');
    }
    return { audioOutputPath: '/mock.wav', mimeType: 'audio/wav', voice: 'alloy' };
  }
}
