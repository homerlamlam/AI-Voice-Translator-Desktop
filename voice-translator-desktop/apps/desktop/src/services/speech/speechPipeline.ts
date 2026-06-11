import type {
  SpeechPipelineResponse,
  SpeechPipelineResult,
  SpeechProvider,
} from '../../types/speech';
import { toAppError } from '../../types/errors';

export interface SpeechPipelineOptions {
  targetLanguage: string;
  voice: string;
}

export class SpeechPipeline {
  private readonly provider: SpeechProvider;

  constructor(provider: SpeechProvider) {
    this.provider = provider;
  }

  async run(
    audio: string | Blob,
    options: SpeechPipelineOptions = { targetLanguage: 'en', voice: 'alloy' },
  ): Promise<SpeechPipelineResponse> {
    try {
      const transcription = await this.provider.transcribe(audio);
      const translation = await this.provider.translate(
        transcription.sourceText,
        options.targetLanguage,
      );
      const synthesis = await this.provider.synthesize(translation.translatedText, options.voice);

      const result: SpeechPipelineResult = {
        sourceText: transcription.sourceText,
        translatedText: translation.translatedText,
        audioOutputPath: synthesis.audioOutputPath,
      };

      return { ok: true, result };
    } catch (error) {
      return {
        ok: false,
        error: toAppError(error, 'ASR_FAILED', 'Speech pipeline failed.'),
      };
    }
  }
}
