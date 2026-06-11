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
- Audio output device enumeration.
- Playback to the selected output device when Chromium supports `setSinkId`.
- Start and stop microphone recording with `MediaRecorder`.
- Recording duration and simple volume meter.
- Mock ASR -> mock translation -> mock TTS pipeline after recording stops.
- Push-to-talk hotkey setting with focused-window press/release handling.
- Speech state machine for `idle -> recording -> transcribing -> translating -> synthesizing -> playing -> idle`.
- UI for status, source text, translated text, errors, and logs.
- ESLint, Prettier, and Vitest.

## Mock Scope

- `MockSpeechProvider` returns fixed Chinese source text, English translation, and a mock TTS audio path.
- `OpenAiSpeechProvider` is only a reserved provider skeleton. It reads configuration but does not call OpenAI yet.
- Mock TTS playback uses a generated WAV test tone, not a real synthesized voice file yet.

## Using VB-Cable or Virtual Audio Cable

1. Install VB-Cable, Virtual Audio Cable, or another virtual audio device.
2. Restart the desktop app if the new device does not appear.
3. Select your real microphone under `Microphone input`.
4. Select the virtual cable output, usually named `CABLE Input`, under `Audio output`.
5. In Discord, Zoom, Teams, or a browser meeting, select the matching virtual microphone, usually named `CABLE Output`, as the meeting input.

This app does not install or implement a virtual audio driver. It only plays translated audio to an output device that the operating system already exposes.

## Environment

Copy `.env.example` to `.env.local` when real providers are added.

```bash
SPEECH_PROVIDER=mock
OPENAI_API_KEY=
```

## Next Recommended Step

Implement task 6: complete the logging/error recovery pass, then add a native global keyboard hook if strict system-wide push-to-talk release detection is required. Electron's built-in `globalShortcut` can detect a global press, but it does not provide reliable key release events.
