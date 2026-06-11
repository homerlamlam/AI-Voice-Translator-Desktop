import type {
  SpeechProvider,
  SynthesisResult,
  TranscriptionResult,
  TranslationResult,
} from '../../../types/speech';
import { VoiceTranslatorError } from '../../../types/errors';

export class OpenAiSpeechProvider implements SpeechProvider {
  private readonly apiKey: string | undefined;

  constructor(apiKey = import.meta.env.VITE_OPENAI_API_KEY) {
    this.apiKey = apiKey;
  }

  async transcribe(_audioPath: string | Blob): Promise<TranscriptionResult> {
    this.assertConfigured();
    throw new VoiceTranslatorError('ASR_FAILED', 'OpenAI provider is reserved for a later task.');
  }

  async translate(_text: string, _targetLanguage: string): Promise<TranslationResult> {
    this.assertConfigured();
    throw new VoiceTranslatorError(
      'TRANSLATION_FAILED',
      'OpenAI provider is reserved for a later task.',
    );
  }

  async synthesize(_text: string, _voice: string): Promise<SynthesisResult> {
    this.assertConfigured();
    throw new VoiceTranslatorError('TTS_FAILED', 'OpenAI provider is reserved for a later task.');
  }

  private assertConfigured(): void {
    if (!this.apiKey) {
      throw new VoiceTranslatorError('CONFIG_LOAD_FAILED', 'OPENAI_API_KEY is not configured.');
    }
  }
}
