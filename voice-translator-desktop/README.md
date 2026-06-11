# Voice Translator Desktop

PC desktop MVP for one-way speech translation:

Chinese speech -> ASR -> English translation -> TTS -> audio output.

This first version only implements the project skeleton, microphone recording, and a mock speech pipeline. It does not call real AI APIs yet.

## Start

```bash
cd voice-translator-desktop
npm install
npm run dev
```

## Test and Lint

```bash
npm run test
npm run lint
```

## Project Structure

```text
apps/desktop/
  src/main/              Electron main process, IPC, global shortcut boundary
  src/renderer/          React UI
  src/services/audio/    Device enumeration and recorder service
  src/services/speech/   Speech pipeline and providers
  src/services/config/   Local settings boundary
  src/types/             Shared app, audio, speech, and error types
  src/tests/             Vitest tests
docs/                    Product, routing, API, and test documentation
```

## Current Features

- Electron + React + TypeScript + Vite desktop app.
- Microphone input device enumeration.
- Audio output device enumeration placeholder.
- Start and stop microphone recording with `MediaRecorder`.
- Recording duration and simple volume meter.
- Mock ASR -> mock translation -> mock TTS pipeline after recording stops.
- UI for status, source text, translated text, errors, and logs.
- ESLint, Prettier, and Vitest.

## Mock Scope

- `MockSpeechProvider` returns fixed Chinese source text, English translation, and a mock TTS audio path.
- `OpenAiSpeechProvider` is only a reserved provider skeleton. It reads configuration but does not call OpenAI yet.
- The "Play test audio" button logs intent only. Output routing to VB-Cable or Virtual Audio Cable is planned for task 4.

## Environment

Copy `.env.example` to `.env.local` when real providers are added.

```bash
SPEECH_PROVIDER=mock
OPENAI_API_KEY=
```

## Next Recommended Step

Implement task 4: audio playback to a selected output device, including a real local test audio file, stop playback, playback state, and README instructions for VB-Cable / Virtual Audio Cable.
