interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`flex min-h-[44px] items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <div
        className={`relative h-8 w-14 rounded-full transition-colors ${
          checked ? 'bg-accent-500' : 'bg-dark-600'
        }`}
      >
        <div
          className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  );
}
