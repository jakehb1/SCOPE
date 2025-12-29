'use client';

import Link from 'next/link';
import { Market } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface MarketCardProps {
  market: Market;
  onViewContext?: (market: Market) => void;
}

const categoryColors: Record<string, string> = {
  sports: 'bg-green-500',
  crypto: 'bg-yellow-500',
  tech: 'bg-gray-500',
  politics: 'bg-blue-500',
  finance: 'bg-purple-500',
  culture: 'bg-pink-500',
  geopolitics: 'bg-red-500',
  other: 'bg-gray-400',
};

export default function MarketCard({ market, onViewContext }: MarketCardProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffHours < 24 && diffHours > 0) {
        return `${diffHours}h left`;
      } else if (diffDays > 0 && diffDays <= 7) {
        return `${diffDays}d left`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
    } catch {
      return 'N/A';
    }
  };

  // Get yes price from market data, default to 50% if not available
  const yesPrice = Math.round(market.yesPrice || 50);

  const categoryColor = market.category ? categoryColors[market.category] || 'bg-gray-400' : 'bg-gray-400';

  const handleContextClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onViewContext) {
      onViewContext(market);
    }
  };

  return (
    <Link
      href={market.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white rounded-xl p-6 flex flex-col shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
    >
      {/* Header: Category Tag and Date */}
      <div className="flex justify-between items-start mb-4">
        {market.category && market.category !== 'all' && (
          <span className={`${categoryColor} text-white text-xs font-medium px-3 py-1 rounded-full capitalize`}>
            {market.category}
          </span>
        )}
        <span className="text-sm text-gray-600 font-medium">{formatDate(market.endDate)}</span>
      </div>

      {/* Question */}
      <h3 className="text-lg font-bold text-primary-black mb-4 line-clamp-2 flex-1 group-hover:text-primary-red transition-colors">
        {market.question}
      </h3>

      {/* Prediction Percentage */}
      <div className="mb-4">
        <div className="text-4xl font-bold text-primary-red mb-1">{yesPrice}%</div>
        <div className="text-sm text-gray-600">yes price</div>
      </div>

      {/* Volume */}
      <div className="mb-4 text-right">
        <div className="text-lg font-bold text-primary-black">{formatCurrency(market.volume)}</div>
        <div className="text-xs text-gray-600">volume</div>
      </div>

      {/* Action Button - Only get context button, card itself is clickable */}
      {onViewContext && (
        <button
          onClick={handleContextClick}
          className="bg-primary-red text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all mt-auto"
        >
          get context
        </button>
      )}
    </Link>
  );
}
