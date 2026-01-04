'use client';

import { useState, useEffect } from 'react';
import { TrackedTrader, TraderPosition } from '@/types/copy-trading';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import DashboardContainer from '@/components/shared/DashboardContainer';
import ElevatedCard from '@/components/shared/ElevatedCard';
import ElevatedButton from '@/components/shared/ElevatedButton';
import PillButton from '@/components/shared/PillButton';
import { LeaderboardCategory, LeaderboardTimePeriod } from '@/types/leaderboard';

const CATEGORY_FILTERS: { value: LeaderboardCategory; label: string }[] = [
  { value: 'OVERALL', label: 'All' },
  { value: 'POLITICS', label: 'Politics' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'TECH', label: 'Tech' },
];

const TIME_PERIOD_FILTERS: { value: LeaderboardTimePeriod; label: string }[] = [
  { value: 'DAY', label: 'Today' },
  { value: 'WEEK', label: 'Week' },
  { value: 'MONTH', label: 'Month' },
  { value: 'ALL', label: 'All Time' },
];

export default function CopyTradingTracker() {
  const [traders, setTraders] = useState<TrackedTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<LeaderboardCategory>('OVERALL');
  const [timePeriod, setTimePeriod] = useState<LeaderboardTimePeriod>('MONTH');
  const [selectedTrader, setSelectedTrader] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchTraders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: '20',
        category,
        timePeriod,
      });
      
      const response = await fetch(`/api/copy-trading?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch traders');
      }

      const data = await response.json();
      
      if (data.traders && data.traders.length > 0) {
        setTraders(data.traders);
        setError(null);
      } else {
        setTraders([]);
        setError('No traders found. Try adjusting filters.');
      }
      
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Error loading traders:', err);
      setError(err.message || 'Unable to fetch traders. Please check your connection and try again.');
      setTraders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraders();
  }, [category, timePeriod]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchTraders, 60000);
    return () => clearInterval(interval);
  }, [category, timePeriod]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPrice = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getProfileUrl = (proxyWallet: string): string => {
    return `https://polymarket.com/profile/${proxyWallet}`;
  };

  const getMarketUrl = (position: TraderPosition): string => {
    if (position.marketSlug) {
      return `https://polymarket.com/event/${position.marketSlug}`;
    }
    return `https://polymarket.com/market/${position.conditionId}`;
  };

  const selectedTraderData = selectedTrader 
    ? traders.find(t => t.proxyWallet === selectedTrader)
    : null;

  return (
    <DashboardContainer>
      <div className="space-y-6">
        {/* Filters */}
        <ElevatedCard className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-primary-black mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_FILTERS.map((filter) => (
                  <PillButton
                    key={filter.value}
                    label={filter.label}
                    onClick={() => setCategory(filter.value)}
                    active={category === filter.value}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {/* Time Period Filter */}
            <div>
              <label className="block text-sm font-medium text-primary-black mb-2">
                Time Period
              </label>
              <div className="flex flex-wrap gap-2">
                {TIME_PERIOD_FILTERS.map((filter) => (
                  <PillButton
                    key={filter.value}
                    label={filter.label}
                    onClick={() => setTimePeriod(filter.value)}
                    active={timePeriod === filter.value}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-right text-sm text-primary-grey md:self-end">
            <div>Last updated: {lastUpdate.toLocaleTimeString()}</div>
            <div className="text-xs">Auto-refreshes every 60s</div>
          </div>
        </ElevatedCard>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-primary-black">Loading traders...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <ElevatedCard className="p-6 bg-red-50 border-red-200">
            <p className="text-red-800">{error}</p>
            <ElevatedButton
              onClick={fetchTraders}
              variant="primary"
              className="mt-4"
            >
              Retry
            </ElevatedButton>
          </ElevatedCard>
        )}

        {/* Traders List */}
        {!loading && !error && (
          <>
            {traders.length === 0 ? (
              <div className="text-center py-12 text-primary-black opacity-90">
                No traders found matching your criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {traders.map((trader) => (
                  <ElevatedCard key={trader.proxyWallet} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-primary-black">
                            {trader.userName || trader.proxyWallet.substring(0, 8) + '...'}
                          </h3>
                          {trader.verifiedBadge && (
                            <span className="text-blue-500">✓</span>
                          )}
                        </div>
                        <p className="text-sm text-primary-grey mb-2">
                          {trader.proxyWallet.substring(0, 6)}...{trader.proxyWallet.substring(trader.proxyWallet.length - 4)}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          {trader.rank && (
                            <span className="text-primary-grey">
                              Rank #{trader.rank}
                            </span>
                          )}
                          <span className={`font-semibold ${trader.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            P&L: {formatCurrency(trader.pnl)}
                          </span>
                          <span className="text-primary-grey">
                            Vol: {formatCurrency(trader.vol)}
                          </span>
                        </div>
                      </div>
                      <ElevatedButton
                        onClick={() => window.open(getProfileUrl(trader.proxyWallet), '_blank', 'noopener,noreferrer')}
                        variant="outline"
                        className="text-sm"
                      >
                        Profile →
                      </ElevatedButton>
                    </div>

                    {/* Positions Summary */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-primary-black">
                          Open Positions
                        </span>
                        <span className="text-lg font-bold text-primary-black">
                          {trader.totalPositions}
                        </span>
                      </div>
                      <div className="text-sm text-primary-grey">
                        Total Value: {formatCurrency(trader.totalValue)}
                      </div>
                    </div>

                    {/* Positions List */}
                    {trader.positions.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-primary-black mb-2">
                          Positions
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {trader.positions.slice(0, 5).map((position) => (
                            <div
                              key={position.conditionId}
                              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={() => window.open(getMarketUrl(position), '_blank', 'noopener,noreferrer')}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <p className="text-sm font-medium text-primary-black flex-1">
                                  {position.marketQuestion}
                                </p>
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded ${
                                    position.outcome === 'YES'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {position.outcome}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-primary-grey mt-2">
                                <span>Shares: {position.shares.toFixed(2)}</span>
                                <span>Avg: {formatPrice(position.avgPrice)}</span>
                                {position.currentPrice && (
                                  <span>Current: {formatPrice(position.currentPrice)}</span>
                                )}
                                {position.pnl !== undefined && (
                                  <span className={position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    P&L: {formatCurrency(position.pnl)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          {trader.positions.length > 5 && (
                            <p className="text-xs text-primary-grey text-center mt-2">
                              +{trader.positions.length - 5} more positions
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {trader.positions.length === 0 && (
                      <p className="text-sm text-primary-grey text-center py-4">
                        No open positions
                      </p>
                    )}
                  </ElevatedCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardContainer>
  );
}

