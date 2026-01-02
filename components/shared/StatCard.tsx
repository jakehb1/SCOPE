'use client';

import ElevatedCard from './ElevatedCard';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export default function StatCard({ label, value, subtext, trend, className = '' }: StatCardProps) {
  return (
    <ElevatedCard className={className}>
      <div className="flex flex-col">
        <div className="text-sm font-medium text-primary-grey mb-2 uppercase tracking-wide">
          {label}
        </div>
        <div className="text-3xl font-bold text-primary-black mb-1">
          {value}
        </div>
        {subtext && (
          <div className={`text-xs font-medium ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-primary-grey'
          }`}>
            {subtext}
          </div>
        )}
      </div>
    </ElevatedCard>
  );
}

