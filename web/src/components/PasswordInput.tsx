import { useState } from 'react';
import '../styles/password-input.css';

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onFocus?: () => void;
};

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = 'Password',
  autoComplete = 'current-password',
  required,
  className = 'form-control',
  style,
  onFocus,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrap" style={style}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className={`${className} password-input-field`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        onFocus={onFocus}
      />
      <button
        type="button"
        className="password-input-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        <i className={`bi ${visible ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden />
      </button>
    </div>
  );
}
