# Product Requirements

## Product Goal

Build a PC desktop tool for one-way real-time assisted speech translation. The MVP focuses on a stable push-to-talk style workflow:

Chinese microphone input -> speech recognition -> English translation -> TTS output.

## MVP Scope

- Desktop application using Electron, React, TypeScript, and Vite.
- Microphone selection and recording.
- Mock ASR, translation, and TTS provider.
- Focused-window push-to-talk using a configurable hotkey.
- State machine for the core translation flow.
- Clear service boundaries for audio, speech providers, config, logging, error mapping, and UI.
- Status, error, source text, translated text, and logs in the UI.

## Not Supported Yet

- Two-way interpretation.
- Capturing the other speaker's system audio.
- Streaming simultaneous interpretation.
- Voice cloning.
- Account system, payment, or cloud sync.
- Custom virtual audio driver.
- Real external AI API calls.
- Strict system-wide push-to-talk release detection without the app focused.

## Roadmap

1. Task 6: complete logging and recoverable error handling.
2. Native global keyboard hook for strict press/release push-to-talk outside the app window.
3. Real OpenAI provider through the Electron main process or another secure backend boundary.
4. Additional providers such as Azure, iFlytek, Volcano, and Tongyi.
5. Stability and compatibility testing with Zoom, Discord, Teams, and browser meetings.
