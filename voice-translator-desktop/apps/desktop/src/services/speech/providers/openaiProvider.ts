import type {
  SpeechProvider,
  SynthesisResult,
  TranscriptionResult,
  TranslationResult,
} from '../../../types/speech';
import { VoiceTranslatorError } from '../../../types/errors';

export class OpenAiSpeechProvider implements SpeechProvider {
  async transcribe(audio: string | Blob): Promise<TranscriptionResult> {
    if (!(audio instanceof Blob)) {
      throw new VoiceTranslatorError('ASR_FAILED', 'OpenAI provider requires a recorded audio blob.');
    }

    const response = await window.desktopApi?.openAiTranscribe({
      audioData: await blobToArrayBuffer(audio),
      mimeType: audio.type || 'audio/webm',
    });

    if (!response) {
      throw new VoiceTranslatorError('ASR_FAILED', 'Desktop OpenAI bridge is not available.');
    }

    if (!response.ok) {
      throw response.error;
    }

    return response.result;
  }

  async translate(text: string, targetLanguage: string): Promise<TranslationResult> {
    const response = await window.desktopApi?.openAiTranslate({ text, targetLanguage });

    if (!response) {
      throw new VoiceTranslatorError('TRANSLATION_FAILED', 'Desktop OpenAI bridge is not available.');
    }

    if (!response.ok) {
      throw response.error;
    }

    return response.result;
  }

  async synthesize(text: string, voice: string): Promise<SynthesisResult> {
    const response = await window.desktopApi?.openAiSynthesize({ text, voice });

    if (!response) {
      throw new VoiceTranslatorError('TTS_FAILED', 'Desktop OpenAI bridge is not available.');
    }

    if (!response.ok) {
      throw response.error;
    }

    return response.result;
  }
}

const blobToArrayBuffer = async (blob: Blob): Promise<ArrayBuffer> => {
  if (typeof blob.arrayBuffer === 'function') {
    return await blob.arrayBuffer();
  }

  return await new Response(blob).arrayBuffer();
};
