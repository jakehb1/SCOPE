'use client';

import { useState, useEffect } from 'react';
import { NewAccountTrade } from '@/lib/polymarket-new-accounts';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import DashboardContainer from '@/components/shared/DashboardContainer';
import ElevatedCard from '@/components/shared/ElevatedCard';
import ElevatedInput from '@/components/shared/ElevatedInput';
import PillButton from '@/components/shared/PillButton';

const ACCOUNT_AGE_OPTIONS = [
  { value: 7, label: 'Last 7 Days' },
  { value: 30, label: 'Last 30 Days' },
  { value: 60, label: 'Last 60 Days' },
  { value: 90, label: 'Last 90 Days' },
];

export default function NewAccountsTracker() {
  const [accounts, setAccounts] = useState<NewAccountTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minTradeSize, setMinTradeSize] = useState<string>('10000');
  const [accountAgeDays, setAccountAgeDays] = useState<number>(30);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      setError(null);
      const min = parseFloat(minTradeSize) || 10000;
      
      const response = await fetch(`/api/new-accounts?minTradeSize=${min}&accountAgeDays=${accountAgeDays}&limit=100`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch new accounts');
      }

      const data = await response.json();
      setAccounts(data.accounts || []);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Error loading new accounts:', err);
      setError(err.message || 'Failed to load new accounts');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAccounts();
  }, [minTradeSize, accountAgeDays]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAccounts, 30000);
    return () => clearInterval(interval);
  }, [minTradeSize, accountAgeDays]);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    }
    if (diffDays === 1) {
      return '1 day ago';
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString();
  };

  const getProfileUrl = (address: string): string => {
    return `https://polymarket.com/profile/${address}`;
  };

  const getTradeUrl = (trade: any): string => {
    if (trade.transactionHash && trade.marketSlug) {
      return `https://polymarket.com/market/${trade.marketSlug}/trade/${trade.transactionHash}`;
    }
    if (trade.marketId) {
      return `https://polymarket.com/market/${trade.marketId}`;
    }
    return '#';
  };

  return (
    <DashboardContainer
      title="New Accounts Tracker"
      subtitle="Recently created accounts making large trades"
    >
      <div className="space-y-6">
        {/* Controls */}
        <ElevatedCard className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1">
              <label htmlFor="minTradeSize" className="block text-sm font-medium text-primary-black mb-2">
                Minimum Trade Size ($)
              </label>
              <ElevatedInput
                id="minTradeSize"
                type="number"
                value={minTradeSize}
                onChange={(e) => setMinTradeSize(e.target.value)}
                placeholder="10000"
                className="w-full md:w-48"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-black mb-2">
                Account Age
              </label>
              <div className="flex gap-2 flex-wrap">
                {ACCOUNT_AGE_OPTIONS.map((option) => (
                  <PillButton
                    key={option.value}
                    label={option.label}
                    onClick={() => setAccountAgeDays(option.value)}
                    active={accountAgeDays === option.value}
                  />
                ))}
              </div>
            </div>

            <div className="text-sm text-primary-grey">
              <div>Last updated: {lastUpdate.toLocaleTimeString()}</div>
              <div className="text-xs">Auto-refreshes every 30s</div>
            </div>
          </div>
        </ElevatedCard>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ElevatedCard className="p-4">
            <div className="text-sm text-primary-grey mb-1">New Accounts</div>
            <div className="text-2xl font-bold text-primary-black">{accounts.length}</div>
          </ElevatedCard>
          <ElevatedCard className="p-4">
            <div className="text-sm text-primary-grey mb-1">Total Volume</div>
            <div className="text-2xl font-bold text-primary-black">
              {formatCurrency(accounts.reduce((sum, a) => sum + a.totalVolume, 0))}
            </div>
          </ElevatedCard>
          <ElevatedCard className="p-4">
            <div className="text-sm text-primary-grey mb-1">Total Trades</div>
            <div className="text-2xl font-bold text-primary-black">
              {accounts.reduce((sum, a) => sum + a.totalTrades, 0)}
            </div>
          </ElevatedCard>
          <ElevatedCard className="p-4">
            <div className="text-sm text-primary-grey mb-1">Largest Trade</div>
            <div className="text-2xl font-bold text-primary-black">
              {accounts.length > 0 
                ? formatCurrency(Math.max(...accounts.map(a => a.largestTrade.investment)))
                : '$0'}
            </div>
          </ElevatedCard>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-primary-black">Loading new accounts...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <ElevatedCard className="p-6 bg-red-50 border-red-200">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchAccounts}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </ElevatedCard>
        )}

        {/* Accounts List */}
        {!loading && !error && (
          <>
            {accounts.length === 0 ? (
              <ElevatedCard className="p-6 text-center">
                <p className="text-primary-black opacity-70">
                  No new accounts found matching your criteria.
                </p>
                <p className="text-sm text-primary-grey mt-2">
                  Try adjusting the minimum trade size or account age filter.
                </p>
              </ElevatedCard>
            ) : (
              <div className="space-y-4">
                {accounts.map((account) => (
                  <ElevatedCard key={account.accountAddress} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-primary-black">
                            {account.accountAddress.substring(0, 10)}...{account.accountAddress.substring(account.accountAddress.length - 8)}
                          </h3>
                          <button
                            onClick={() => window.open(getProfileUrl(account.accountAddress), '_blank', 'noopener,noreferrer')}
                            className="text-sm text-primary-grey hover:text-primary-black underline"
                          >
                            View Profile →
                          </button>
                        </div>
                        {account.firstTradeDate && (
                          <p className="text-sm text-primary-grey">
                            First trade: {formatTime(account.firstTradeDate)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-black">
                          {formatCurrency(account.totalVolume)}
                        </div>
                        <div className="text-sm text-primary-grey">
                          {account.totalTrades} trades
                        </div>
                      </div>
                    </div>

                    {/* Largest Trade */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-primary-black">Largest Trade</span>
                        <span className="text-lg font-bold text-primary-black">
                          {formatCurrency(account.largestTrade.investment)}
                        </span>
                      </div>
                      <p className="text-sm text-primary-grey mb-2">{account.largestTrade.market}</p>
                      <div className="flex items-center gap-4 text-xs text-primary-grey">
                        <span>
                          {account.largestTrade.side.toUpperCase()} @ {account.largestTrade.price.toFixed(2)}%
                        </span>
                        <span>•</span>
                        <span>{formatTime(account.largestTrade.time)}</span>
                        <button
                          onClick={() => {
                            const url = getTradeUrl(account.largestTrade);
                            if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          className="text-primary-black hover:underline"
                        >
                          View Trade →
                        </button>
                      </div>
                    </div>

                    {/* Recent Trades */}
                    {account.recentTrades.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-primary-black mb-2">Recent Trades</p>
                        <div className="space-y-2">
                          {account.recentTrades.slice(0, 3).map((trade) => (
                            <div
                              key={trade.id}
                              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                              onClick={() => {
                                const url = getTradeUrl(trade);
                                if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              <div className="flex-1">
                                <p className="text-sm text-primary-black">{trade.market}</p>
                                <p className="text-xs text-primary-grey">
                                  {trade.side.toUpperCase()} {formatCurrency(trade.investment)} @ {trade.price.toFixed(2)}%
                                </p>
                              </div>
                              <span className="text-xs text-primary-grey">{formatTime(trade.time)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
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

