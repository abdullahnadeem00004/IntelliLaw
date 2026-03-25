import React from 'react';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function PhoneInput({ 
  value, 
  onChange, 
  label = "Phone Number", 
  placeholder = "e.g. 0300 1234567", 
  disabled,
  required 
}: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Simple formatting for Pakistani numbers
    // If it starts with 92, keep it. If it starts with 0, replace with 92.
    if (val.startsWith('0')) {
      val = '92' + val.substring(1);
    } else if (val.length > 0 && !val.startsWith('92')) {
      // If it doesn't start with 92 or 0, assume it's just the number part
      val = '92' + val;
    }

    // Limit length to 12 digits (92 + 10 digits)
    if (val.length > 12) {
      val = val.substring(0, 12);
    }

    onChange(val);
  };

  const formatDisplay = (val: string) => {
    if (!val) return '';
    if (val.length <= 2) return '+' + val;
    if (val.length <= 5) return `+${val.substring(0, 2)} ${val.substring(2)}`;
    return `+${val.substring(0, 2)} ${val.substring(2, 5)} ${val.substring(5)}`;
  };

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="tel"
          value={formatDisplay(value)}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className="input-field pl-10 text-sm"
          required={required}
        />
      </div>
      <p className="text-[10px] text-neutral-400 mt-1">Format: +92 3XX XXXXXXX or +92 XX XXXXXXX</p>
    </div>
  );
}
