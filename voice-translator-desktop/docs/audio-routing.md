# Audio Routing

## Real Microphone Input

The renderer process uses `navigator.mediaDevices` and `MediaRecorder` to capture audio from the selected microphone. The first MVP asks for microphone permission through the operating system and browser permission flow inside Electron.

## Software Processing

Recorded audio is passed to `SpeechPipeline`. The pipeline calls a `SpeechProvider` in this order:

1. `transcribe`
2. `translate`
3. `synthesize`

The current provider is mock-only.

## Selected Output Device

The app enumerates `audiooutput` devices and uses `HTMLAudioElement.setSinkId` when Chromium exposes it. If the selected runtime does not support `setSinkId`, playback falls back to the system default output device.

## Virtual Audio Devices

The app will not build a virtual audio driver. Users should install an existing tool such as VB-Cable or Virtual Audio Cable, then choose that virtual output device in this app.

## Meeting Software Usage

The intended routing is:

1. Select your real microphone in this app.
2. Select `CABLE Input` or another virtual output device in this app.
3. In Discord, Zoom, Teams, or a browser meeting, select the matching virtual microphone as the meeting input.

This lets meeting software receive the translated TTS audio as if it were microphone input.
