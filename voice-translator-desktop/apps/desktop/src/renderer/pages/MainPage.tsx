import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AudioDeviceOption } from '../../types/audio';
import { AudioRecorderService } from '../../services/audio/recorder';
import { AudioPlayerService } from '../../services/audio/player';
import { listInputDevices } from '../../services/audio/inputDevices';
import { listOutputDevices } from '../../services/audio/outputDevices';
import { SpeechPipeline } from '../../services/speech/speechPipeline';
import { MockSpeechProvider } from '../../services/speech/providers/mockProvider';
import { toAppError } from '../../types/errors';
import { DeviceSelect } from '../components/DeviceSelect';
import { LogPanel } from '../components/LogPanel';
import { useAppStore } from '../stores/appStore';

const formatDuration = (durationMs: number) => `${(durationMs / 1000).toFixed(1)}s`;

export const MainPage = () => {
  const [inputDevices, setInputDevices] = useState<AudioDeviceOption[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDeviceOption[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState('');
  const [selectedOutputDevice, setSelectedOutputDevice] = useState('');
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolume] = useState(0);
  const recorderRef = useRef<AudioRecorderService | null>(null);
  const playerRef = useRef<AudioPlayerService>(new AudioPlayerService());

  const { status, sourceText, translatedText, error, logs, setStatus, setTexts, setError, addLog } =
    useAppStore();

  const pipeline = useMemo(() => new SpeechPipeline(new MockSpeechProvider()), []);

  const refreshDevices = useCallback(async () => {
    try {
      const [inputs, outputs] = await Promise.all([listInputDevices(), listOutputDevices()]);
      setInputDevices(inputs);
      setOutputDevices(outputs);
      setSelectedInputDevice((current) => current || inputs[0]?.deviceId || '');
      setSelectedOutputDevice((current) => current || outputs[0]?.deviceId || '');
      addLog(`devices refreshed: ${inputs.length} input(s), ${outputs.length} output(s)`);
    } catch (caughtError) {
      const appError = toAppError(caughtError, 'MIC_DEVICE_NOT_FOUND', 'Failed to list devices.');
      setError(appError);
      setStatus('error');
      addLog(`${appError.code}: ${appError.message}`);
    }
  }, [addLog, setError, setStatus]);

  useEffect(() => {
    void refreshDevices();
    return () => {
      recorderRef.current?.dispose();
      playerRef.current.stop();
    };
  }, [refreshDevices]);

  const startRecording = async () => {
    try {
      setError(undefined);
      setTexts('', '');
      setDurationMs(0);
      setVolume(0);
      recorderRef.current = new AudioRecorderService({
        onDuration: setDurationMs,
        onVolume: setVolume,
      });
      await recorderRef.current.start(selectedInputDevice || undefined);
      setStatus('recording');
      addLog('recording started');
    } catch (caughtError) {
      const appError = toAppError(caughtError, 'RECORDING_FAILED', 'Failed to start recording.');
      setError(appError);
      setStatus('error');
      addLog(`${appError.code}: ${appError.message}`);
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) {
      return;
    }

    try {
      const recording = await recorderRef.current.stop();
      addLog(`recording stopped, duration ${formatDuration(recording.durationMs)}`);

      setStatus('transcribing');
      addLog('transcribing...');
      setStatus('translating');
      addLog('translating...');
      setStatus('synthesizing');
      addLog('synthesizing...');

      const response = await pipeline.run(recording.blob);
      if (!response.ok) {
        setError(response.error);
        setStatus('error');
        addLog(`${response.error.code}: ${response.error.message}`);
        return;
      }

      setTexts(response.result.sourceText, response.result.translatedText);
      addLog(`source text: ${response.result.sourceText}`);
      addLog(`translated text: ${response.result.translatedText}`);
      addLog(`mock tts audio: ${response.result.audioOutputPath}`);
      setStatus('playing');
      addLog(
        selectedOutputDevice
          ? `playing audio to device: ${selectedOutputDevice}`
          : 'playing audio to default output device',
      );
      await playerRef.current.play({
        source: playerRef.current.createTestTone(),
        outputDeviceId: selectedOutputDevice || undefined,
      });
      setStatus('idle');
    } catch (caughtError) {
      const appError = toAppError(caughtError, 'AUDIO_OUTPUT_FAILED', 'Failed to complete flow.');
      setError(appError);
      setStatus('error');
      addLog(`${appError.code}: ${appError.message}`);
    }
  };

  const playTestAudio = async () => {
    try {
      setError(undefined);
      setStatus('playing');
      addLog(
        selectedOutputDevice
          ? `playing test audio to device: ${selectedOutputDevice}`
          : 'playing test audio to default output device',
      );
      await playerRef.current.play({
        source: playerRef.current.createTestTone(),
        outputDeviceId: selectedOutputDevice || undefined,
      });
      setStatus('idle');
    } catch (caughtError) {
      const appError = toAppError(caughtError, 'AUDIO_OUTPUT_FAILED', 'Failed to play test audio.');
      setError(appError);
      setStatus('error');
      addLog(`${appError.code}: ${appError.message}`);
    }
  };

  const stopPlayback = () => {
    playerRef.current.stop();
    setStatus('idle');
    addLog('playback stopped');
  };

  const isRecording = status === 'recording';
  const isPlaying = status === 'playing';

  return (
    <main className="app-shell">
      <header>
        <div>
          <h1>Voice Translator Desktop</h1>
          <p>Push-to-talk MVP foundation: microphone recording and mock speech pipeline.</p>
        </div>
        <button className="secondary" onClick={() => void refreshDevices()}>
          Refresh devices
        </button>
      </header>

      <section className="panel controls">
        <DeviceSelect
          id="input-device"
          label="Microphone input"
          value={selectedInputDevice}
          devices={inputDevices}
          placeholder="Select microphone"
          onChange={setSelectedInputDevice}
        />
        <DeviceSelect
          id="output-device"
          label="Audio output"
          value={selectedOutputDevice}
          devices={outputDevices}
          placeholder="Use default output device"
          onChange={setSelectedOutputDevice}
        />

        <div className="button-row">
          <button disabled={isRecording} onClick={() => void startRecording()}>
            Start recording
          </button>
          <button disabled={!isRecording} onClick={() => void stopRecording()}>
            Stop recording
          </button>
          <button className="secondary" disabled={isRecording || isPlaying} onClick={playTestAudio}>
            Play test audio
          </button>
          <button className="secondary" disabled={!isPlaying} onClick={stopPlayback}>
            Stop playback
          </button>
        </div>

        <div className="meter-grid">
          <div>
            <span className="label">Duration</span>
            <strong>{formatDuration(durationMs)}</strong>
          </div>
          <div>
            <span className="label">Volume</span>
            <div className="volume-track">
              <div className="volume-fill" style={{ width: `${Math.round(volume * 100)}%` }} />
            </div>
          </div>
          <div>
            <span className="label">Status</span>
            <strong className={`status status-${status}`}>{status}</strong>
          </div>
        </div>
      </section>

      {error ? (
        <section className="error-panel">
          <strong>{error.code}</strong>
          <span>{error.message}</span>
        </section>
      ) : null}

      <section className="content-grid">
        <article className="panel transcript">
          <h2>Original Chinese</h2>
          <p>{sourceText || 'Recorded Chinese text will appear here after mock ASR.'}</p>
        </article>
        <article className="panel transcript">
          <h2>English Translation</h2>
          <p>{translatedText || 'English translation will appear here after mock translation.'}</p>
        </article>
      </section>

      <LogPanel logs={logs} />
    </main>
  );
};
