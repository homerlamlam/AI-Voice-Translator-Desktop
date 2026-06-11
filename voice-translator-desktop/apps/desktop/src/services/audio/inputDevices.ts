import type { AudioDeviceOption } from '../../types/audio';
import { VoiceTranslatorError } from '../../types/errors';

export const requestMicrophoneAccess = async (deviceId?: string): Promise<MediaStream> => {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      video: false,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      throw new VoiceTranslatorError(
        'MIC_PERMISSION_DENIED',
        'Microphone permission was denied.',
        error,
      );
    }

    if (error instanceof DOMException && error.name === 'NotFoundError') {
      throw new VoiceTranslatorError('MIC_DEVICE_NOT_FOUND', 'No microphone device was found.', error);
    }

    throw new VoiceTranslatorError('RECORDING_FAILED', 'Failed to access microphone.', error);
  }
};

export const listInputDevices = async (): Promise<AudioDeviceOption[]> => {
  if (!navigator.mediaDevices?.enumerateDevices) {
    throw new VoiceTranslatorError('MIC_DEVICE_NOT_FOUND', 'Media devices are not available.');
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const microphones = devices
    .filter((device) => device.kind === 'audioinput')
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `Microphone ${index + 1}`,
      kind: device.kind,
    }));

  if (microphones.length === 0) {
    throw new VoiceTranslatorError('MIC_DEVICE_NOT_FOUND', 'No microphone device was found.');
  }

  return microphones;
};
