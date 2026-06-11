import type { AudioDeviceOption } from '../../types/audio';

interface DeviceSelectProps {
  id: string;
  label: string;
  value: string;
  devices: AudioDeviceOption[];
  placeholder: string;
  onChange: (deviceId: string) => void;
}

export const DeviceSelect = ({
  id,
  label,
  value,
  devices,
  placeholder,
  onChange,
}: DeviceSelectProps) => (
  <label className="field" htmlFor={id}>
    <span>{label}</span>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label}
        </option>
      ))}
    </select>
  </label>
);
