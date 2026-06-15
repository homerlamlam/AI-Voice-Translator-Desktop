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
      expect(response.result.sourceText).toBe(
        '\u6211\u60f3\u786e\u8ba4\u4e00\u4e0b\u660e\u5929\u7684\u4f1a\u8bae\u65f6\u95f4',
      );
      expect(response.result.translatedText).toBe("I'd like to confirm tomorrow's meeting time.");
      expect(response.result.audioOutputPath).toBe('/mock-audio/tts-confirm-meeting.wav');
    }
  });

  it('reports pipeline stages in execution order', async () => {
    const pipeline = new SpeechPipeline(new MockSpeechProvider());
    const stages: string[] = [];

    await pipeline.run(new Blob(['audio']), {
      targetLanguage: 'en',
      voice: 'alloy',
      onStage: (stage) => stages.push(stage),
    });

    expect(stages).toEqual(['transcribing', 'translating', 'synthesizing']);
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

  it('maps generic provider errors to the active stage error code', async () => {
    const pipeline = new SpeechPipeline(new GenericFailingProvider('translate'));

    const response = await pipeline.run(new Blob(['audio']));

    expect(response.ok).toBe(false);
    if (!response.ok) {
      expect(response.error.code).toBe('TRANSLATION_FAILED');
      expect(response.error.message).toBe('Generic provider failure.');
    }
  });

  it('passes synthesized playback urls through the pipeline result', async () => {
    const pipeline = new SpeechPipeline(new PlaybackUrlProvider());

    const response = await pipeline.run(new Blob(['audio']));

    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.result.audioOutputPath).toBe('file:///tmp/tts.mp3');
      expect(response.result.audioPlaybackUrl).toBe('data:audio/mpeg;base64,AAAA');
    }
  });
});

class FailingProvider implements SpeechProvider {
  constructor(private readonly stage: 'transcribe' | 'translate' | 'synthesize') {}

  async transcribe(): Promise<TranscriptionResult> {
    if (this.stage === 'transcribe') {
      throw new VoiceTranslatorError('ASR_FAILED', 'ASR failed.');
    }
    return { sourceText: '\u4f60\u597d', language: 'zh-CN' };
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

class GenericFailingProvider implements SpeechProvider {
  constructor(private readonly stage: 'transcribe' | 'translate' | 'synthesize') {}

  async transcribe(): Promise<TranscriptionResult> {
    if (this.stage === 'transcribe') {
      throw new Error('Generic provider failure.');
    }
    return { sourceText: '\u4f60\u597d', language: 'zh-CN' };
  }

  async translate(): Promise<TranslationResult> {
    if (this.stage === 'translate') {
      throw new Error('Generic provider failure.');
    }
    return { translatedText: 'Hello', targetLanguage: 'en' };
  }

  async synthesize(): Promise<SynthesisResult> {
    if (this.stage === 'synthesize') {
      throw new Error('Generic provider failure.');
    }
    return { audioOutputPath: '/mock.wav', mimeType: 'audio/wav', voice: 'alloy' };
  }
}

class PlaybackUrlProvider implements SpeechProvider {
  async transcribe(): Promise<TranscriptionResult> {
    return { sourceText: '\u4f60\u597d', language: 'zh-CN' };
  }

  async translate(): Promise<TranslationResult> {
    return { translatedText: 'Hello', targetLanguage: 'en' };
  }

  async synthesize(): Promise<SynthesisResult> {
    return {
      audioOutputPath: 'file:///tmp/tts.mp3',
      audioPlaybackUrl: 'data:audio/mpeg;base64,AAAA',
      mimeType: 'audio/mpeg',
      voice: 'alloy',
    };
  }
}
