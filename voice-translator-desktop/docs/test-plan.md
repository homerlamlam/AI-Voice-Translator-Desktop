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

Output playback is planned for task 4.

## Mock Pipeline Tests

- Mock ASR returns fixed Chinese text.
- Mock translation returns fixed English text.
- Mock TTS returns a fixed local audio path.
- ASR, translation, and TTS failures return explicit error codes.

## Push-to-Talk Tests

- Default hotkey is `Alt + Space`.
- Press starts recording.
- Release stops recording.
- Stop triggers transcribing, translating, synthesizing, playing.
- Debounce prevents repeated accidental triggering.

Push-to-talk is planned for task 5.

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
