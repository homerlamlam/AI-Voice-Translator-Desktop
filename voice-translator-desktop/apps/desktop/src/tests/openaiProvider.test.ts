import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenAiSpeechProvider } from '../services/speech/providers/openaiProvider';

describe('OpenAiSpeechProvider renderer bridge', () => {
  beforeEach(() => {
    window.desktopApi = {
      ping: vi.fn(),
      openAiTranscribe: vi.fn(),
      openAiTranslate: vi.fn(),
      openAiSynthesize: vi.fn(),
      setGlobalPushToTalkHotkey: vi.fn(),
      onGlobalPushToTalkPressed: vi.fn(),
    };
  });

  it('sends audio blobs through the desktop bridge', async () => {
    const desktopApi = window.desktopApi;
    if (!desktopApi) {
      throw new Error('desktopApi was not initialized.');
    }
    vi.mocked(desktopApi.openAiTranscribe).mockResolvedValue({
      ok: true,
      result: { sourceText: '\u4f60\u597d', language: 'zh-CN' },
    });
    const provider = new OpenAiSpeechProvider();

    const result = await provider.transcribe(new Blob(['audio'], { type: 'audio/webm' }));

    expect(result.sourceText).toBe('\u4f60\u597d');
    expect(desktopApi.openAiTranscribe).toHaveBeenCalledWith({
      audioData: expect.any(ArrayBuffer),
      mimeType: 'audio/webm',
    });
  });

  it('throws explicit bridge errors', async () => {
    const desktopApi = window.desktopApi;
    if (!desktopApi) {
      throw new Error('desktopApi was not initialized.');
    }
    vi.mocked(desktopApi.openAiTranslate).mockResolvedValue({
      ok: false,
      error: { code: 'TRANSLATION_FAILED', message: 'Translation failed.' },
    });
    const provider = new OpenAiSpeechProvider();

    await expect(provider.translate('\u4f60\u597d', 'en')).rejects.toMatchObject({
      code: 'TRANSLATION_FAILED',
    });
  });

  it('returns synthesized file urls from the desktop bridge', async () => {
    const desktopApi = window.desktopApi;
    if (!desktopApi) {
      throw new Error('desktopApi was not initialized.');
    }
    vi.mocked(desktopApi.openAiSynthesize).mockResolvedValue({
      ok: true,
      result: {
        audioOutputPath: 'file:///tmp/tts.mp3',
        mimeType: 'audio/mpeg',
        voice: 'alloy',
      },
    });
    const provider = new OpenAiSpeechProvider();

    const result = await provider.synthesize('Hello', 'alloy');

    expect(result.audioOutputPath).toBe('file:///tmp/tts.mp3');
  });
});
