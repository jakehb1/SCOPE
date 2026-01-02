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
        bg-white rounded-2xl p-6
        border border-gray-200
        shadow-sm
        ${hover ? 'hover:shadow-lg hover:border-gray-300 transition-all duration-300' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

