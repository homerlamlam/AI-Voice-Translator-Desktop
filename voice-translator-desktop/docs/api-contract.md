# API Contract

## SpeechProvider

```ts
interface SpeechProvider {
  transcribe(audioPath: string | Blob): Promise<TranscriptionResult>;
  translate(text: string, targetLanguage: string): Promise<TranslationResult>;
  synthesize(text: string, voice: string): Promise<SynthesisResult>;
}
```

## Result Types

```ts
interface TranscriptionResult {
  sourceText: string;
  language: string;
}

interface TranslationResult {
  translatedText: string;
  targetLanguage: string;
}

interface SynthesisResult {
  audioOutputPath: string;
  mimeType: string;
  voice: string;
}

interface SpeechPipelineResult {
  sourceText: string;
  translatedText: string;
  audioOutputPath: string;
}
```

## Error Codes

- `MIC_PERMISSION_DENIED`
- `MIC_DEVICE_NOT_FOUND`
- `RECORDING_FAILED`
- `ASR_FAILED`
- `TRANSLATION_FAILED`
- `TTS_FAILED`
- `AUDIO_OUTPUT_FAILED`
- `HOTKEY_REGISTER_FAILED`
- `CONFIG_LOAD_FAILED`

## Runtime States

- `idle`
- `recording`
- `transcribing`
- `translating`
- `synthesizing`
- `playing`
- `error`

Expected successful flow:

```text
idle -> recording -> transcribing -> translating -> synthesizing -> playing -> idle
```

All service failures should surface a code and a user-readable message.

## Logging

```ts
interface LogEntry {
  id: string;
  time: string;
  level: 'info' | 'error';
  message: string;
}
```

Logs are newest-first in the UI. Status transitions, push-to-talk actions, source text, translated text, playback target, and recoverable errors should all be logged.

## OpenAI Provider Boundary

The renderer never reads `OPENAI_API_KEY`. In OpenAI mode it calls Electron IPC:

- `speech:openai-transcribe`
- `speech:openai-translate`
- `speech:openai-synthesize`

The main process reads `.env.local` or process environment variables, calls OpenAI, writes synthesized audio to local app data, and returns a playable `file://` URL.

Any `sk-...` token found in user-visible error messages must be redacted as `[REDACTED_API_KEY]`.
