'use client';

interface PillButtonProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  variant?: 'default' | 'subtle';
}

export default function PillButton({ label, active = false, onClick, variant = 'default' }: PillButtonProps) {
  if (variant === 'subtle') {
    return (
      <button
        onClick={onClick}
        className={`
          px-4 py-2 rounded-full font-medium text-sm
          transition-all duration-200
          ${
            active
              ? 'bg-primary-black text-primary-offwhite shadow-sm'
              : 'bg-white border border-gray-200 text-primary-black hover:bg-gray-50 hover:border-gray-300'
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
      className={`
        px-5 py-2.5 rounded-full font-medium text-sm
        transition-all duration-200
        ${
          active
            ? 'bg-primary-black text-primary-offwhite shadow-md'
            : 'bg-white bg-opacity-60 text-primary-black hover:bg-opacity-80 hover:shadow-sm'
        }
      `}
    >
      {label}
    </button>
  );
}

