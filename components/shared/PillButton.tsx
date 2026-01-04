'use client';

interface PillButtonProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  variant?: 'default' | 'subtle';
  disabled?: boolean;
}

export default function PillButton({ label, active = false, onClick, variant = 'default', disabled = false }: PillButtonProps) {
  if (variant === 'subtle') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          px-4 py-2.5 rounded-full font-medium text-sm min-h-[44px]
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${
            active
              ? 'bg-primary-black text-primary-offwhite shadow-sm dark:bg-white dark:text-[#40424C]'
              : 'bg-white border border-gray-200 text-primary-black hover:bg-gray-50 hover:border-gray-300 dark:bg-[#4A4D58] dark:border-[#565862] dark:text-gray-300 dark:hover:bg-[#565862]'
          }
        `}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-5 py-3 rounded-full font-medium text-sm min-h-[44px]
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${
          active
            ? 'bg-primary-black text-primary-offwhite shadow-md dark:bg-white dark:text-[#40424C]'
            : 'bg-white bg-opacity-60 text-primary-black hover:bg-opacity-80 hover:shadow-sm dark:bg-[#4A4D58] dark:bg-opacity-60 dark:text-gray-300 dark:hover:bg-opacity-80'
        }
      `}
    >
      {label}
    </button>
  );
}

