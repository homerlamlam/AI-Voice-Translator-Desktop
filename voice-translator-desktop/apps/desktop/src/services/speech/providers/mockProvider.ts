import type {
  SpeechProvider,
  SynthesisResult,
  TranscriptionResult,
  TranslationResult,
} from '../../../types/speech';

export class MockSpeechProvider implements SpeechProvider {
  async transcribe(_audioPath: string | Blob): Promise<TranscriptionResult> {
    await delay(250);
    return {
      sourceText: '我想确认一下明天的会议时间',
      language: 'zh-CN',
    };
  }

  async translate(text: string, targetLanguage: string): Promise<TranslationResult> {
    await delay(250);
    return {
      translatedText:
        text.trim().length > 0
          ? "I'd like to confirm tomorrow's meeting time."
          : 'No speech was detected.',
      targetLanguage,
    };
  }

  async synthesize(_text: string, voice: string): Promise<SynthesisResult> {
    await delay(250);
    return {
      audioOutputPath: '/mock-audio/tts-confirm-meeting.wav',
      mimeType: 'audio/wav',
      voice,
    };
  }
}

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
