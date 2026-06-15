# v0.1.0-alpha

Initial alpha release for the one-way desktop voice translator MVP.

## Included

- Electron + React + TypeScript + Vite desktop app.
- Microphone and audio output device selection.
- Manual recording and focused-window push-to-talk.
- Mock speech provider for offline ASR -> translation -> TTS flow.
- OpenAI speech provider through the Electron main-process bridge.
- OpenAI ASR, translation, TTS, and playback through a renderer-safe audio URL.
- Status, source text, translated text, errors, and info/error logs.
- Recoverable error state and API key redaction in user-visible errors.
- Unit tests for recorder, player, speech pipeline, hotkey matching, logger, errors, and OpenAI bridge.

## Known Limitations

- Global push-to-talk release detection outside the focused app window is not implemented yet.
- No packaged installer yet; run with `npm run dev`.
- No custom virtual audio driver; use VB-Cable or Virtual Audio Cable for meeting software routing.
- No provider split for third-party ASR/TTS/translation providers yet.

## Validation

```powershell
npm run test
npm run lint
npm run build
```
