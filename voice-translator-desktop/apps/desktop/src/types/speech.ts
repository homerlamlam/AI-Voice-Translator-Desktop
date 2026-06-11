import type { AppError } from './errors.js';

export interface TranscriptionResult {
  sourceText: string;
  language: string;
}

export interface TranslationResult {
  translatedText: string;
  targetLanguage: string;
}

export interface SynthesisResult {
  audioOutputPath: string;
  mimeType: string;
  voice: string;
}

export interface SpeechPipelineResult {
  sourceText: string;
  translatedText: string;
  audioOutputPath: string;
}

export interface SpeechProvider {
  transcribe(audioPath: string | Blob): Promise<TranscriptionResult>;
  translate(text: string, targetLanguage: string): Promise<TranslationResult>;
  synthesize(text: string, voice: string): Promise<SynthesisResult>;
}

export type SpeechPipelineFailure = {
  ok: false;
  error: AppError;
};

export type SpeechPipelineSuccess = {
  ok: true;
  result: SpeechPipelineResult;
};

export type SpeechPipelineResponse = SpeechPipelineSuccess | SpeechPipelineFailure;
