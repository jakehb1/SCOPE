'use client';

import { ReactNode } from 'react';

interface ElevatedCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function ElevatedCard({ children, className = '', hover = false, onClick }: ElevatedCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-[#4A4D58] rounded-2xl p-4 md:p-6
        border border-gray-200 dark:border-[#565862]
        shadow-sm
        ${hover ? 'hover:shadow-lg hover:border-gray-300 dark:hover:border-[#6A6D72] transition-all duration-300' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

