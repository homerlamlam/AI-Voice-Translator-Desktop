import type {
  SpeechPipelineResponse,
  SpeechPipelineResult,
  SpeechProvider,
} from '../../types/speech';
import type { AppStatus } from '../../types/status';
import { toAppError } from '../../types/errors';

export interface SpeechPipelineOptions {
  targetLanguage: string;
  voice: string;
  onStage?: (stage: Extract<AppStatus, 'transcribing' | 'translating' | 'synthesizing'>) => void;
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
      options.onStage?.('transcribing');
      const transcription = await this.provider.transcribe(audio);

      options.onStage?.('translating');
      const translation = await this.provider.translate(
        transcription.sourceText,
        options.targetLanguage,
      );

      options.onStage?.('synthesizing');
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
