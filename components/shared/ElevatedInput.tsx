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
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
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
            min-h-[44px]
            bg-white dark:bg-[#4A4D58]
            border border-gray-200 dark:border-[#565862]
            rounded-xl
            focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent
            text-gray-900 dark:text-white
            placeholder:text-gray-500 dark:placeholder:text-gray-400
            transition-all duration-200
            shadow-sm
            ${className}
          `}
        />
      </div>
    </div>
  );
}

