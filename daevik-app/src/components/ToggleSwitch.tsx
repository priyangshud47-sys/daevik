'use client';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function ToggleSwitch({ checked, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        height: '24px',
        width: '44px',
        borderRadius: '9999px',
        backgroundColor: checked ? 'var(--color-success)' : 'var(--color-border)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s ease-in-out',
        padding: '2px',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          height: '20px',
          width: '20px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s ease-in-out',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      />
    </button>
  );
}
