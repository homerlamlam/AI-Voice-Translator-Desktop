import type {
  SpeechPipelineResponse,
  SpeechPipelineResult,
  SpeechProvider,
} from '../../types/speech';
import type { AppStatus } from '../../types/status';
import type { AppErrorCode } from '../../types/errors';
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
      const transcription = await runPipelineStage(
        () => this.provider.transcribe(audio),
        'ASR_FAILED',
        'Speech transcription failed.',
      );

      options.onStage?.('translating');
      const translation = await runPipelineStage(
        () => this.provider.translate(transcription.sourceText, options.targetLanguage),
        'TRANSLATION_FAILED',
        'Speech translation failed.',
      );

      options.onStage?.('synthesizing');
      const synthesis = await runPipelineStage(
        () => this.provider.synthesize(translation.translatedText, options.voice),
        'TTS_FAILED',
        'Speech synthesis failed.',
      );

      const result: SpeechPipelineResult = {
        sourceText: transcription.sourceText,
        translatedText: translation.translatedText,
        audioOutputPath: synthesis.audioOutputPath,
        audioPlaybackUrl: synthesis.audioPlaybackUrl,
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

const runPipelineStage = async <T>(
  action: () => Promise<T>,
  fallbackCode: AppErrorCode,
  fallbackMessage: string,
): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    throw toAppError(error, fallbackCode, fallbackMessage);
  }
};
