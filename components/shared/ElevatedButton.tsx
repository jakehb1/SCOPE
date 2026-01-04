'use client';

import { ReactNode } from 'react';

interface ElevatedButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function ElevatedButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}: ElevatedButtonProps) {
  const baseStyles = 'font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-black text-primary-offwhite hover:bg-opacity-90 shadow-sm hover:shadow-md',
    secondary: 'bg-primary-grey text-primary-offwhite hover:bg-opacity-90 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-primary-black hover:bg-gray-100',
    outline: 'bg-transparent border-2 border-primary-black text-primary-black hover:bg-primary-black hover:text-primary-offwhite',
  };

  const sizes = {
    sm: 'px-4 py-2.5 text-sm min-h-[44px]', // Minimum 44px touch target
    md: 'px-5 py-3 text-base min-h-[44px]', // Minimum 44px touch target
    lg: 'px-6 py-3.5 text-lg min-h-[48px]', // Slightly larger for desktop
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

