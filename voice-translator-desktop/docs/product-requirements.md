# Product Requirements

## Product Goal

Build a PC desktop tool for one-way real-time assisted speech translation. The MVP focuses on a stable push-to-talk style workflow:

Chinese microphone input -> speech recognition -> English translation -> TTS output.

## MVP Scope

- Desktop application using Electron, React, TypeScript, and Vite.
- Microphone selection and recording.
- Mock ASR, translation, and TTS provider.
- Clear service boundaries for audio, speech providers, config, logging, and UI.
- Status, error, source text, translated text, and logs in the UI.

## Not Supported Yet

- Two-way interpretation.
- Capturing the other speaker's system audio.
- Streaming simultaneous interpretation.
- Voice cloning.
- Account system, payment, or cloud sync.
- Custom virtual audio driver.
- Real external AI API calls.

## Roadmap

1. Task 4: play generated audio to a selected output device.
2. Task 5: global push-to-talk hotkey with a state machine.
3. Task 6: complete logging and recoverable error handling.
4. Real OpenAI provider.
5. Additional providers such as Azure, iFlytek, Volcano, and Tongyi.
6. Stability and compatibility testing with Zoom, Discord, Teams, and browser meetings.
