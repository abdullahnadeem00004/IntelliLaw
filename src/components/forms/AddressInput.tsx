import React from 'react';
import { PAKISTAN_PROVINCES, PAKISTAN_DISTRICTS } from '../../constants';

interface AddressData {
  province: string;
  district: string;
  city: string;
  area: string;
  postalCode: string;
}

interface AddressInputProps {
  value: AddressData;
  onChange: (value: AddressData) => void;
  disabled?: boolean;
}

export default function AddressInput({ value, onChange, disabled }: AddressInputProps) {
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const province = e.target.value;
    onChange({
      ...value,
      province,
      district: '', // Reset district when province changes
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value: val } = e.target;
    onChange({ ...value, [name]: val });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Province</label>
        <select
          name="province"
          value={value.province}
          onChange={handleProvinceChange}
          disabled={disabled}
          className="input-field text-sm"
        >
          <option value="">Select Province</option>
          {PAKISTAN_PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">District</label>
        <select
          name="district"
          value={value.district}
          onChange={handleChange}
          disabled={disabled || !value.province}
          className="input-field text-sm"
        >
          <option value="">Select District</option>
          {value.province && PAKISTAN_DISTRICTS[value.province]?.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">City</label>
        <input
          type="text"
          name="city"
          value={value.city}
          onChange={handleChange}
          disabled={disabled}
          placeholder="e.g. Lahore"
          className="input-field text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Area / Street</label>
        <input
          type="text"
          name="area"
          value={value.area}
          onChange={handleChange}
          disabled={disabled}
          placeholder="e.g. Gulberg III"
          className="input-field text-sm"
        />
      </div>

      <div className="space-y-1 md:col-span-2">
        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Postal Code</label>
        <input
          type="text"
          name="postalCode"
          value={value.postalCode}
          onChange={handleChange}
          disabled={disabled}
          placeholder="e.g. 54000"
          className="input-field text-sm"
        />
      </div>
    </div>
  );
}
