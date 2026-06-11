import type { AudioDeviceOption } from '../../types/audio';

export const listOutputDevices = async (): Promise<AudioDeviceOption[]> => {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((device) => device.kind === 'audiooutput')
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `Output device ${index + 1}`,
      kind: device.kind,
    }));
};
