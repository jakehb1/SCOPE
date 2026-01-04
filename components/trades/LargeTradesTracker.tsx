'use client';

import { useState, useEffect } from 'react';
import { Trade, TradeTypeFilter } from '@/types/trade';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import DashboardContainer from '@/components/shared/DashboardContainer';
import ElevatedCard from '@/components/shared/ElevatedCard';
import ElevatedInput from '@/components/shared/ElevatedInput';
import PillButton from '@/components/shared/PillButton';

const TRADE_TYPE_FILTERS: { value: TradeTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'buys', label: 'Buys Only' },
  { value: 'sells', label: 'Sells Only' },
];

type TimeFilter = 'all' | '5m' | '15m' | '30m' | '1h' | '24h';

const TIME_FILTERS: { value: TimeFilter; label: string; minutes: number }[] = [
  { value: 'all', label: 'All Time', minutes: 0 },
  { value: '5m', label: '5 Min', minutes: 5 },
  { value: '15m', label: '15 Min', minutes: 15 },
  { value: '30m', label: '30 Min', minutes: 30 },
  { value: '1h', label: '1 Hour', minutes: 60 },
  { value: '24h', label: '24 Hours', minutes: 1440 },
];

export default function LargeTradesTracker() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minAmount, setMinAmount] = useState<string>('10000');
  const [tradeTypeFilter, setTradeTypeFilter] = useState<TradeTypeFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch trades
  const fetchTrades = async () => {
    try {
      setError(null);
      const min = parseFloat(minAmount) || 10000;
      
      // Calculate time filter if needed
      let url = `/api/trades?minAmount=${min}&limit=100`;
      if (timeFilter !== 'all') {
        const timeFilterConfig = TIME_FILTERS.find(f => f.value === timeFilter);
        if (timeFilterConfig && timeFilterConfig.minutes > 0) {
          url += `&timeframeMinutes=${timeFilterConfig.minutes}`;
        }
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }

      const data = await response.json();
      
      // Always show trades if available, even if there's an error message
      if (data.trades && data.trades.length > 0) {
        setTrades(data.trades);
        setError(null); // Clear error if we have data
      } else if (data.error) {
        // If API returned an error but no trades, show error
        setError(data.error);
        setTrades([]);
      } else {
        // No trades and no error - might be empty result
        setTrades([]);
        setError(null);
      }
      
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Error loading trades:', err);
      // Don't set error state - let the empty state show instead
      // The API should return real trades or empty array
      setTrades([]);
      setError('Unable to fetch trades. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTrades();
  }, [minAmount]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchTrades, 15000);
    return () => clearInterval(interval);
  }, [minAmount]);

  // Filter trades
  const filteredTrades = trades.filter(trade => {
    // Filter by trade type
    if (tradeTypeFilter === 'buys' && trade.side !== 'buy') return false;
    if (tradeTypeFilter === 'sells' && trade.side !== 'sell') return false;
    
    // Filter by time
    if (timeFilter !== 'all') {
      const timeFilterConfig = TIME_FILTERS.find(f => f.value === timeFilter);
      if (timeFilterConfig && timeFilterConfig.minutes > 0) {
        const tradeTime = new Date(trade.time).getTime();
        const cutoffTime = Date.now() - (timeFilterConfig.minutes * 60 * 1000);
        if (tradeTime < cutoffTime) return false;
      }
    }
    
    return true;
  });

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
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);

    if (diffMins < 1) {
      return `${diffSecs}s ago`;
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return date.toLocaleDateString();
  };

  const getTradeUrl = (trade: Trade): string => {
    // If we have transaction hash and market slug, use direct trade link
    if (trade.transactionHash && trade.marketSlug) {
      return `https://polymarket.com/market/${trade.marketSlug}/trade/${trade.transactionHash}`;
    }
    // If we have transaction hash, try to construct link
    if (trade.transactionHash) {
      // Try to get market slug from marketId or use conditionId
      const marketPath = trade.marketSlug || trade.marketId;
      if (marketPath) {
        return `https://polymarket.com/market/${marketPath}/trade/${trade.transactionHash}`;
      }
      // Fallback: link to transaction on Polygonscan
      return `https://polygonscan.com/tx/${trade.transactionHash}`;
    }
    // Fallback to market page if we have marketId
    if (trade.marketId) {
      return `https://polymarket.com/market/${trade.marketId}`;
    }
    return '#';
  };

  return (
    <DashboardContainer>
      <div className="space-y-6">
        {/* Controls */}
        <ElevatedCard className="p-4 md:p-6">
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 w-full sm:w-auto">
                <label htmlFor="minAmount" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Minimum Trade Size ($)
                </label>
                <ElevatedInput
                  id="minAmount"
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="10000"
                  className="w-full sm:w-48"
                />
              </div>

              <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400 text-right">
                <div>Last updated: {lastUpdate.toLocaleTimeString()}</div>
                <div className="text-xs">Auto-refreshes every 15s</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Trade Type
                </label>
                <div className="flex gap-2 flex-wrap">
                  {TRADE_TYPE_FILTERS.map((filter) => (
                    <PillButton
                      key={filter.value}
                      label={filter.label}
                      onClick={() => setTradeTypeFilter(filter.value)}
                      active={tradeTypeFilter === filter.value}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Time Period
                </label>
                <div className="flex gap-2 flex-wrap">
                  {TIME_FILTERS.map((filter) => (
                    <PillButton
                      key={filter.value}
                      label={filter.label}
                      onClick={() => setTimeFilter(filter.value)}
                      active={timeFilter === filter.value}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="sm:hidden text-sm text-gray-600 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-[#565862]">
              <div>Last updated: {lastUpdate.toLocaleTimeString()}</div>
              <div className="text-xs">Auto-refreshes every 15s</div>
            </div>
          </div>
        </ElevatedCard>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <ElevatedCard className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Trades</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredTrades.length}</div>
          </ElevatedCard>
          <ElevatedCard className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Volume</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(filteredTrades.reduce((sum, t) => sum + t.investment, 0))}
            </div>
          </ElevatedCard>
          <ElevatedCard className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Buys</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {filteredTrades.filter(t => t.side === 'buy').length}
            </div>
          </ElevatedCard>
          <ElevatedCard className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sells</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {filteredTrades.filter(t => t.side === 'sell').length}
            </div>
          </ElevatedCard>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-primary-black">Loading trades...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <ElevatedCard className="p-4 md:p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={fetchTrades}
              className="mt-4 px-5 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 min-h-[44px] font-medium"
            >
              Retry
            </button>
          </ElevatedCard>
        )}

        {/* Trades Table */}
        {!loading && !error && (
          <>
            {filteredTrades.length === 0 ? (
              <ElevatedCard className="p-6">
                <div className="text-center">
                  <p className="text-primary-black opacity-70 mb-4">
                    No trades available at this time.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
                    <p className="text-yellow-800 font-semibold mb-2">⚠️ Trades API Status</p>
                    <p className="text-yellow-700 text-sm mb-2">
                      Polymarket's trades API requires authentication or a WebSocket connection. 
                      The REST API endpoints for trades are not publicly available.
                    </p>
                    <p className="text-yellow-700 text-sm mb-2">
                      To enable real trades tracking, you would need to:
                    </p>
                    <ul className="text-yellow-700 text-sm list-disc list-inside space-y-1 mb-2">
                      <li>Set up Polymarket API authentication</li>
                      <li>Implement WebSocket connection to RTDS (Real-Time Data Socket)</li>
                      <li>Or use a third-party service that provides trade data</li>
                    </ul>
                    <p className="text-yellow-700 text-sm">
                      For now, this page will show trades once the API is properly configured.
                    </p>
                  </div>
                </div>
              </ElevatedCard>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {filteredTrades.map((trade) => (
                    <ElevatedCard
                      key={trade.id}
                      className="p-4 cursor-pointer"
                      onClick={() => {
                        const url = getTradeUrl(trade);
                        if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                            {trade.market}
                          </div>
                          {trade.category && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{trade.category}</div>
                          )}
                        </div>
                        <span
                          className={`ml-2 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            trade.side === 'buy'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {trade.side.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Amount</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(trade.investment)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Price</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{trade.price.toFixed(2)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Shares</div>
                          <div className="text-gray-700 dark:text-gray-300">{trade.shares.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Time</div>
                          <div className="text-gray-700 dark:text-gray-300">{formatTime(trade.time)}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#565862]">
                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {trade.traderAddress || trade.trader}
                          {trade.isInsiderLike && (
                            <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-semibold">• Insider</span>
                          )}
                        </div>
                      </div>
                    </ElevatedCard>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <ElevatedCard className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-[#565862] border-b border-gray-200 dark:border-[#6A6D72]">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Market
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Trader
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Side
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Shares
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-[#4A4D58] divide-y divide-gray-200 dark:divide-[#565862]">
                          {filteredTrades.map((trade) => (
                            <tr
                            key={trade.id}
                            className="hover:bg-gray-50 dark:hover:bg-[#565862] transition-colors cursor-pointer"
                            onClick={() => {
                              const url = getTradeUrl(trade);
                              if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                            title={`View trade on Polymarket${trade.transactionHash ? ` (${trade.transactionHash.substring(0, 8)}...)` : ''}`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {formatTime(trade.time)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {trade.market}
                                </div>
                                {trade.category && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{trade.category}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {trade.traderAddress || trade.trader}
                                </div>
                                {trade.isInsiderLike && (
                                  <div className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">Insider</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    trade.side === 'buy'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}
                                >
                                  {trade.side.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white text-right">
                                {formatCurrency(trade.investment)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                                {trade.price.toFixed(2)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">
                                {trade.shares.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ElevatedCard>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardContainer>
  );
}

