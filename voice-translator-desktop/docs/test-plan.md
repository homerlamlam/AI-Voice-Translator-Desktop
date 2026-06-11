# Test Plan

## Recording Tests

- Enumerate microphone devices.
- Start and stop recording.
- Confirm a blob is returned after stop.
- Show recording duration.
- Show a simple volume meter.
- Handle permission denied, no device, device unavailable, and recording failure.

## Output Device Tests

- Enumerate audio output devices.
- Play a local WAV or MP3 to the selected device.
- Stop playback.
- Verify playback state in the UI.

The first implementation uses a generated WAV test tone and `HTMLAudioElement`. Real TTS audio files should reuse the same player service.

## Mock Pipeline Tests

- Mock ASR returns fixed Chinese text.
- Mock translation returns fixed English text.
- Mock TTS returns a fixed local audio path.
- ASR, translation, and TTS failures return explicit error codes.
- Generic provider exceptions are mapped to the active stage error code.
- Error logs use `level: error`.

## OpenAI Provider Tests

- Renderer provider sends audio bytes through the desktop bridge.
- Renderer provider preserves explicit bridge errors.
- Main process keeps `OPENAI_API_KEY` out of renderer code.
- With a real key, record a short Chinese phrase and verify OpenAI ASR, translation, TTS file creation, and playback.

## Push-to-Talk Tests

- Default hotkey is `Alt + Space`.
- Press starts recording while the app window is focused.
- Release stops recording while the app window is focused.
- Stop triggers transcribing, translating, synthesizing, playing.
- Debounce prevents repeated accidental triggering.
- State machine rejects invalid transitions.
- Hotkey setting persists in local storage.
- Error recovery resets recorder/player state back to `idle`.

Electron's built-in `globalShortcut` can detect global key press events, but it does not expose reliable key release events. Strict system-wide push-to-talk should be covered by a native keyboard hook compatibility test before release.

## 30 Minute Stability Test

- Keep the app open for 30 minutes.
- Run repeated record -> pipeline cycles.
- Confirm no unreleased microphone tracks.
- Confirm logs remain usable.
- Confirm the UI can recover from failed cycles.

## Zoom / Discord / Teams Compatibility

- Route TTS output to VB-Cable or Virtual Audio Cable.
- Select the virtual microphone in Zoom, Discord, Teams, and browser meetings.
- Confirm meeting participants receive the generated English audio.
- Confirm the user's real microphone is not directly routed into the meeting unless intended.
