import { app } from 'electron';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type {
  SynthesisResult,
  TranscriptionResult,
  TranslationResult,
} from '../types/speech.js';
import type { AppErrorCode } from '../types/errors.js';
import { VoiceTranslatorError } from '../types/errors.js';

interface OpenAiConfig {
  apiKey: string;
  transcriptionModel: string;
  translationModel: string;
  ttsModel: string;
}

export class MainOpenAiSpeechProvider {
  private readonly config: OpenAiConfig;

  constructor(config = loadOpenAiConfig()) {
    this.config = config;
  }

  async transcribe(audioData: ArrayBuffer, mimeType: string): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('model', this.config.transcriptionModel);
    formData.append('file', new Blob([audioData], { type: mimeType }), fileNameForMimeType(mimeType));

    const response = await this.request(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        body: formData,
      },
      'ASR_FAILED',
    );
    const body = (await response.json()) as { text?: string; language?: string };

    if (!body.text) {
      throw new VoiceTranslatorError('ASR_FAILED', 'OpenAI transcription returned no text.');
    }

    return {
      sourceText: body.text,
      language: body.language ?? 'zh-CN',
    };
  }

  async translate(text: string, targetLanguage: string): Promise<TranslationResult> {
    const response = await this.request(
      'https://api.openai.com/v1/responses',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.translationModel,
          input: [
            {
              role: 'system',
              content:
                'Translate Chinese speech transcript into natural spoken English. Return only the translation.',
            },
            {
              role: 'user',
              content: `Target language: ${targetLanguage}\n\n${text}`,
            },
          ],
        }),
      },
      'TRANSLATION_FAILED',
    );
    const body = (await response.json()) as unknown;
    const translatedText = extractResponseText(body);

    if (!translatedText) {
      throw new VoiceTranslatorError('TRANSLATION_FAILED', 'OpenAI translation returned no text.');
    }

    return { translatedText, targetLanguage };
  }

  async synthesize(text: string, voice: string): Promise<SynthesisResult> {
    const response = await this.request(
      'https://api.openai.com/v1/audio/speech',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.ttsModel,
          voice,
          input: text,
          response_format: 'mp3',
        }),
      },
      'TTS_FAILED',
    );
    const audio = Buffer.from(await response.arrayBuffer());
    const outputDir = path.join(app.getPath('userData'), 'tts-output');
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `openai-tts-${Date.now()}.mp3`);
    await fs.writeFile(outputPath, audio);

    return {
      audioOutputPath: pathToFileURL(outputPath).toString(),
      mimeType: 'audio/mpeg',
      voice,
    };
  }

  private async request(
    url: string,
    init: RequestInit,
    errorCode: Exclude<AppErrorCode, 'CONFIG_LOAD_FAILED'>,
  ): Promise<Response> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        ...init.headers,
      },
    });

    if (!response.ok) {
      const message = await readOpenAiError(response);
      throw new VoiceTranslatorError(response.status === 401 ? 'CONFIG_LOAD_FAILED' : errorCode, message);
    }

    return response;
  }
}

const loadOpenAiConfig = (): OpenAiConfig => {
  const env = { ...readEnvFile(), ...process.env };
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new VoiceTranslatorError('CONFIG_LOAD_FAILED', 'OPENAI_API_KEY is not configured.');
  }

  return {
    apiKey,
    transcriptionModel: env.OPENAI_TRANSCRIPTION_MODEL ?? 'gpt-4o-mini-transcribe',
    translationModel: env.OPENAI_TRANSLATION_MODEL ?? 'gpt-4o-mini',
    ttsModel: env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts',
  };
};

const readEnvFile = (): Record<string, string> => {
  const candidates = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '..', '.env.local'),
    path.resolve(process.cwd(), '..', '..', '.env'),
  ];

  for (const candidate of candidates) {
    try {
      const raw = fsSync.readFileSync(candidate, 'utf8');
      return Object.fromEntries(
        raw
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('#') && line.includes('='))
          .map((line) => {
            const [key, ...value] = line.split('=');
            return [key.trim(), value.join('=').trim().replace(/^["']|["']$/g, '')];
          }),
      );
    } catch {
      // Continue to the next candidate path.
    }
  }

  return {};
};

const fileNameForMimeType = (mimeType: string) => {
  if (mimeType.includes('wav')) {
    return 'recording.wav';
  }

  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
    return 'recording.mp3';
  }

  return 'recording.webm';
};

const extractResponseText = (body: unknown): string => {
  if (!body || typeof body !== 'object') {
    return '';
  }

  const candidate = body as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
  };

  if (candidate.output_text) {
    return candidate.output_text.trim();
  }

  return (
    candidate.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .find((text) => text && text.trim().length > 0)
      ?.trim() ?? ''
  );
};

const readOpenAiError = async (response: Response) => {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? `OpenAI request failed with status ${response.status}.`;
  } catch {
    return `OpenAI request failed with status ${response.status}.`;
  }
};
