import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AudioDeviceOption } from '../../types/audio';
import type { AppStatus } from '../../types/status';
import { AudioRecorderService } from '../../services/audio/recorder';
import { AudioPlayerService } from '../../services/audio/player';
import { listInputDevices } from '../../services/audio/inputDevices';
import { listOutputDevices } from '../../services/audio/outputDevices';
import { SettingsStore } from '../../services/config/settingsStore';
import {
  matchesPushToTalkStart,
  matchesPushToTalkStop,
  normalizePushToTalkHotkey,
  supportedPushToTalkHotkeys,
} from '../../services/hotkeys/pushToTalkHotkey';
import { SpeechPipeline } from '../../services/speech/speechPipeline';
import { MockSpeechProvider } from '../../services/speech/providers/mockProvider';
import { OpenAiSpeechProvider } from '../../services/speech/providers/openaiProvider';
import { SpeechStateMachine } from '../../services/state/speechStateMachine';
import { toAppError } from '../../types/errors';
import type { AppSettings } from '../../services/config/settingsStore';
import { DeviceSelect } from '../components/DeviceSelect';
import { LogPanel } from '../components/LogPanel';
import { useAppStore } from '../stores/appStore';

const formatDuration = (durationMs: number) => `${(durationMs / 1000).toFixed(1)}s`;
const pushToTalkDebounceMs = 250;

export const MainPage = () => {
  const settingsStore = useMemo(() => new SettingsStore(), []);
  const initialSettings = useMemo(() => settingsStore.load(), [settingsStore]);
  const [inputDevices, setInputDevices] = useState<AudioDeviceOption[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDeviceOption[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState(initialSettings.inputDeviceId ?? '');
  const [selectedOutputDevice, setSelectedOutputDevice] = useState(
    initialSettings.outputDeviceId ?? '',
  );
  const [pushToTalkHotkey, setPushToTalkHotkey] = useState(
    normalizePushToTalkHotkey(initialSettings.pushToTalkHotkey),
  );
  const [speechProvider, setSpeechProvider] = useState<AppSettings['speechProvider']>(
    initialSettings.speechProvider,
  );
  const [isDesktopBridgeAvailable, setIsDesktopBridgeAvailable] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolume] = useState(0);
  const recorderRef = useRef<AudioRecorderService | null>(null);
  const playerRef = useRef<AudioPlayerService>(new AudioPlayerService());
  const stateMachineRef = useRef(new SpeechStateMachine());
  const pttActiveRef = useRef(false);
  const lastPttStartAtRef = useRef(0);
  const statusRef = useRef<AppStatus>('idle');

  const {
    status,
    sourceText,
    translatedText,
    error,
    logs,
    setStatus,
    setTexts,
    setError,
    addLog,
    addErrorLog,
    clearError,
  } = useAppStore();

  const pipeline = useMemo(
    () =>
      new SpeechPipeline(
        speechProvider === 'openai' ? new OpenAiSpeechProvider() : new MockSpeechProvider(),
      ),
    [speechProvider],
  );

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const hasBridge = Boolean(window.desktopApi);
    setIsDesktopBridgeAvailable(hasBridge);

    if (!hasBridge && speechProvider === 'openai') {
      setSpeechProvider('mock');
      addLog('OpenAI provider requires the Electron desktop bridge; falling back to mock provider');
    }
  }, [addLog, speechProvider]);

  const transitionTo = useCallback(
    (nextStatus: AppStatus) => {
      if (stateMachineRef.current.status === nextStatus) {
        setStatus(nextStatus);
        return;
      }

      stateMachineRef.current.transition(nextStatus);
      setStatus(nextStatus);
    },
    [setStatus],
  );

  const enterError = useCallback(
    (caughtError: unknown, fallbackCode: Parameters<typeof toAppError>[1], fallbackMessage: string) => {
      const appError = toAppError(caughtError, fallbackCode, fallbackMessage);
      setError(appError);
      try {
        transitionTo('error');
      } catch {
        stateMachineRef.current.reset();
        transitionTo('error');
      }
      addErrorLog(appError);
    },
    [addErrorLog, setError, transitionTo],
  );

  const saveSettings = useCallback(
    (overrides: Partial<typeof initialSettings>) => {
      settingsStore.save({
        ...settingsStore.load(),
        inputDeviceId: selectedInputDevice,
        outputDeviceId: selectedOutputDevice,
        pushToTalkHotkey,
        speechProvider,
        ...overrides,
      });
    },
    [pushToTalkHotkey, selectedInputDevice, selectedOutputDevice, settingsStore, speechProvider],
  );

  const refreshDevices = useCallback(async () => {
    try {
      const [inputs, outputs] = await Promise.all([listInputDevices(), listOutputDevices()]);
      setInputDevices(inputs);
      setOutputDevices(outputs);
      setSelectedInputDevice((current) => current || inputs[0]?.deviceId || '');
      setSelectedOutputDevice((current) => current || outputs[0]?.deviceId || '');
      addLog(`devices refreshed: ${inputs.length} input(s), ${outputs.length} output(s)`);
    } catch (caughtError) {
      enterError(caughtError, 'MIC_DEVICE_NOT_FOUND', 'Failed to list devices.');
    }
  }, [addLog, enterError]);

  useEffect(() => {
    void refreshDevices();
    return () => {
      recorderRef.current?.dispose();
      playerRef.current.stop();
    };
  }, [refreshDevices]);

  const handleInputDeviceChange = (deviceId: string) => {
    setSelectedInputDevice(deviceId);
    saveSettings({ inputDeviceId: deviceId });
  };

  const handleOutputDeviceChange = (deviceId: string) => {
    setSelectedOutputDevice(deviceId);
    saveSettings({ outputDeviceId: deviceId });
  };

  const handleHotkeyChange = (hotkey: string) => {
    const normalized = normalizePushToTalkHotkey(hotkey);
    setPushToTalkHotkey(normalized);
    saveSettings({ pushToTalkHotkey: normalized });
    addLog(`push-to-talk hotkey set to ${normalized}`);
    void window.desktopApi?.setGlobalPushToTalkHotkey(normalized).then((response) => {
      if (!response.ok) {
        setError(response.error);
        addErrorLog(response.error);
      }
    });
  };

  const handleSpeechProviderChange = (provider: AppSettings['speechProvider']) => {
    if (provider === 'openai' && !isDesktopBridgeAvailable) {
      addLog('OpenAI provider requires the Electron desktop app window');
      return;
    }

    setSpeechProvider(provider);
    saveSettings({ speechProvider: provider });
    addLog(`speech provider set to ${provider}`);
  };

  const startRecording = useCallback(async () => {
    if (statusRef.current !== 'idle' && statusRef.current !== 'error') {
      return;
    }

    try {
      if (statusRef.current === 'error') {
        stateMachineRef.current.reset();
        transitionTo('idle');
      }

      setError(undefined);
      setTexts('', '');
      setDurationMs(0);
      setVolume(0);
      recorderRef.current = new AudioRecorderService({
        onDuration: setDurationMs,
        onVolume: setVolume,
      });
      await recorderRef.current.start(selectedInputDevice || undefined);
      transitionTo('recording');
      addLog('recording started');
    } catch (caughtError) {
      enterError(caughtError, 'RECORDING_FAILED', 'Failed to start recording.');
    }
  }, [addLog, enterError, selectedInputDevice, setError, setTexts, transitionTo]);

  const runSpeechFlow = useCallback(
    async (blob: Blob) => {
      const response = await pipeline.run(blob, {
        targetLanguage: initialSettings.targetLanguage,
        voice: initialSettings.voice,
        onStage: (stage) => {
          transitionTo(stage);
          addLog(`${stage}...`);
        },
      });

      if (!response.ok) {
        setError(response.error);
        transitionTo('error');
        addErrorLog(response.error);
        return;
      }

      setTexts(response.result.sourceText, response.result.translatedText);
      addLog(`source text: ${response.result.sourceText}`);
      addLog(`translated text: ${response.result.translatedText}`);
      addLog(`${speechProvider} tts audio: ${response.result.audioOutputPath}`);
      transitionTo('playing');
      addLog(
        selectedOutputDevice
          ? `playing audio to device: ${selectedOutputDevice}`
          : 'playing audio to default output device',
      );
      await playerRef.current.play({
        source:
          speechProvider === 'openai'
            ? response.result.audioPlaybackUrl || response.result.audioOutputPath
            : playerRef.current.createTestTone(),
        outputDeviceId: selectedOutputDevice || undefined,
      });
      transitionTo('idle');
    },
    [
      addLog,
      initialSettings.targetLanguage,
      initialSettings.voice,
      pipeline,
      selectedOutputDevice,
      speechProvider,
      setError,
      setTexts,
      transitionTo,
    ],
  );

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || statusRef.current !== 'recording') {
      return;
    }

    let recording: Awaited<ReturnType<AudioRecorderService['stop']>>;
    try {
      recording = await recorderRef.current.stop();
      addLog(`recording stopped, duration ${formatDuration(recording.durationMs)}`);
    } catch (caughtError) {
      enterError(caughtError, 'RECORDING_FAILED', 'Failed to stop recording.');
      return;
    }

    try {
      await runSpeechFlow(recording.blob);
    } catch (caughtError) {
      enterError(caughtError, 'AUDIO_OUTPUT_FAILED', 'Failed to complete flow.');
    }
  }, [addLog, enterError, runSpeechFlow]);

  const recoverFromError = () => {
    recorderRef.current?.dispose();
    playerRef.current.stop();
    stateMachineRef.current.reset();
    clearError();
    setDurationMs(0);
    setVolume(0);
    transitionTo('idle');
    addLog('recovered from error');
  };

  const playTestAudio = async () => {
    try {
      setError(undefined);
      if (statusRef.current === 'error') {
        stateMachineRef.current.reset();
      }
      transitionTo('playing');
      addLog(
        selectedOutputDevice
          ? `playing test audio to device: ${selectedOutputDevice}`
          : 'playing test audio to default output device',
      );
      await playerRef.current.play({
        source: playerRef.current.createTestTone(),
        outputDeviceId: selectedOutputDevice || undefined,
      });
      transitionTo('idle');
    } catch (caughtError) {
      enterError(caughtError, 'AUDIO_OUTPUT_FAILED', 'Failed to play test audio.');
    }
  };

  const stopPlayback = () => {
    playerRef.current.stop();
    if (statusRef.current === 'playing') {
      transitionTo('idle');
    }
    addLog('playback stopped');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!matchesPushToTalkStart(event, pushToTalkHotkey)) {
        return;
      }

      event.preventDefault();
      const now = Date.now();
      if (pttActiveRef.current || now - lastPttStartAtRef.current < pushToTalkDebounceMs) {
        return;
      }

      pttActiveRef.current = true;
      lastPttStartAtRef.current = now;
      addLog(`push-to-talk pressed: ${pushToTalkHotkey}`);
      void startRecording();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!pttActiveRef.current || !matchesPushToTalkStop(event, pushToTalkHotkey)) {
        return;
      }

      event.preventDefault();
      pttActiveRef.current = false;
      addLog(`push-to-talk released: ${pushToTalkHotkey}`);
      void stopRecording();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [addLog, pushToTalkHotkey, startRecording, stopRecording]);

  useEffect(() => {
    const unsubscribe = window.desktopApi?.onGlobalPushToTalkPressed(() => {
      addLog('global push-to-talk press detected; release detection requires focused window MVP');
    });

    return () => unsubscribe?.();
  }, [addLog]);

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
          onChange={handleInputDeviceChange}
        />
        <DeviceSelect
          id="output-device"
          label="Audio output"
          value={selectedOutputDevice}
          devices={outputDevices}
          placeholder="Use default output device"
          onChange={handleOutputDeviceChange}
        />

        <label className="field" htmlFor="speech-provider">
          <span>Speech provider</span>
          <select
            id="speech-provider"
            value={speechProvider}
            onChange={(event) =>
              handleSpeechProviderChange(event.target.value as AppSettings['speechProvider'])
            }
          >
            <option value="mock">Mock provider</option>
            <option value="openai" disabled={!isDesktopBridgeAvailable}>
              OpenAI provider
            </option>
          </select>
        </label>

        <div className="hotkey-note">
          Desktop bridge: {isDesktopBridgeAvailable ? 'available' : 'unavailable'}
        </div>

        <label className="field" htmlFor="ptt-hotkey">
          <span>Push-to-talk hotkey</span>
          <select
            id="ptt-hotkey"
            value={pushToTalkHotkey}
            onChange={(event) => handleHotkeyChange(event.target.value)}
          >
            {supportedPushToTalkHotkeys.map((hotkey) => (
              <option key={hotkey} value={hotkey}>
                {hotkey}
              </option>
            ))}
          </select>
        </label>

        <div className="hotkey-note">
          Hold {pushToTalkHotkey} while this window is focused. Main-process global press detection
          is registered, but global release detection is deferred to the native hook step.
        </div>

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
          <div>
            <strong>{error.code}</strong>
            <span>{error.message}</span>
          </div>
          <button className="secondary" onClick={recoverFromError}>
            Recover
          </button>
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
