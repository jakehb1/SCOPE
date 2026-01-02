'use client';

import { ReactNode } from 'react';

interface DashboardContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export default function DashboardContainer({
  children,
  title,
  subtitle,
  actions,
  className = '',
}: DashboardContainerProps) {
  return (
    <div className={`section-container py-8 ${className}`}>
      {(title || subtitle || actions) && (
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
            {(title || subtitle) && (
              <div>
                {title && (
                  <h1 className="text-4xl md:text-5xl font-bold text-primary-black mb-2 tracking-tight">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-lg text-primary-grey font-medium">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

