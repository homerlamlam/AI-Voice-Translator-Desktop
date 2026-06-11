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

All service failures should surface a code and a user-readable message.
