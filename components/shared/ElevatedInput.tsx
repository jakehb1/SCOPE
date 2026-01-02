'use client';

import { InputHTMLAttributes } from 'react';

interface ElevatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
}

export default function ElevatedInput({ icon, label, className = '', ...props }: ElevatedInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-primary-black mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`
            w-full
            ${icon ? 'pl-12' : 'pl-4'}
            pr-4 py-3
            bg-white
            border border-gray-200
            rounded-xl
            focus:outline-none focus:ring-2 focus:ring-primary-black focus:border-transparent
            text-primary-black
            placeholder:text-primary-grey
            transition-all duration-200
            shadow-sm
            ${className}
          `}
        />
      </div>
    </div>
  );
}

