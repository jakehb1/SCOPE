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

export default function LargeTradesTracker() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minAmount, setMinAmount] = useState<string>('1000');
  const [tradeTypeFilter, setTradeTypeFilter] = useState<TradeTypeFilter>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch trades
  const fetchTrades = async () => {
    try {
      setError(null);
      const min = parseFloat(minAmount) || 1000;
      
      const response = await fetch(`/api/trades?minAmount=${min}&limit=100`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }

      const data = await response.json();
      setTrades(data.trades || []);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Error loading trades:', err);
      setError(err.message || 'Failed to load trades');
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
    if (tradeTypeFilter === 'buys' && trade.side !== 'buy') return false;
    if (tradeTypeFilter === 'sells' && trade.side !== 'sell') return false;
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

  const getMarketUrl = (marketId: string): string => {
    if (!marketId) return '#';
    // Try to construct Polymarket URL
    return `https://polymarket.com/market/${marketId}`;
  };

  return (
    <DashboardContainer
      title="Large Trades Tracker"
      subtitle="Live tracking of significant purchases on Polymarket"
    >
      <div className="space-y-6">
        {/* Controls */}
        <ElevatedCard className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1">
              <label htmlFor="minAmount" className="block text-sm font-medium text-primary-black mb-2">
                Minimum Trade Size ($)
              </label>
              <ElevatedInput
                id="minAmount"
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="1000"
                className="w-full md:w-48"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-black mb-2">
                Trade Type
              </label>
              <div className="flex gap-2">
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

            <div className="text-sm text-primary-grey">
              <div>Last updated: {lastUpdate.toLocaleTimeString()}</div>
              <div className="text-xs">Auto-refreshes every 15s</div>
            </div>
          </div>
        </ElevatedCard>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ElevatedCard className="p-4">
            <div className="text-sm text-primary-grey mb-1">Total Trades</div>
            <div className="text-2xl font-bold text-primary-black">{filteredTrades.length}</div>
          </ElevatedCard>
          <ElevatedCard className="p-4">
            <div className="text-sm text-primary-grey mb-1">Total Volume</div>
            <div className="text-2xl font-bold text-primary-black">
              {formatCurrency(filteredTrades.reduce((sum, t) => sum + t.investment, 0))}
            </div>
          </ElevatedCard>
          <ElevatedCard className="p-4">
            <div className="text-sm text-primary-grey mb-1">Buys</div>
            <div className="text-2xl font-bold text-green-600">
              {filteredTrades.filter(t => t.side === 'buy').length}
            </div>
          </ElevatedCard>
          <ElevatedCard className="p-4">
            <div className="text-sm text-primary-grey mb-1">Sells</div>
            <div className="text-2xl font-bold text-red-600">
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
          <ElevatedCard className="p-6 bg-red-50 border-red-200">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchTrades}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </ElevatedCard>
        )}

        {/* Trades Table */}
        {!loading && !error && (
          <>
            {filteredTrades.length === 0 ? (
              <ElevatedCard className="p-6 text-center">
                <p className="text-primary-black opacity-70">
                  No large trades found matching your criteria.
                </p>
                <p className="text-sm text-primary-grey mt-2">
                  Try lowering the minimum trade size or check back later.
                </p>
              </ElevatedCard>
            ) : (
              <ElevatedCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Market
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trader
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Side
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Shares
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTrades.map((trade) => (
                        <tr
                          key={trade.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            const url = getMarketUrl(trade.marketId);
                            if (url !== '#') window.open(url, '_blank');
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-black">
                            {formatTime(trade.time)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-primary-black">
                              {trade.market}
                            </div>
                            {trade.category && (
                              <div className="text-xs text-primary-grey">{trade.category}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-primary-black">
                              {trade.traderAddress || trade.trader}
                            </div>
                            {trade.isInsiderLike && (
                              <div className="text-xs text-yellow-600 font-semibold">Insider</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                trade.side === 'buy'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {trade.side.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-black text-right">
                            {formatCurrency(trade.investment)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-black text-right">
                            {trade.price.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-grey text-right">
                            {trade.shares.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ElevatedCard>
            )}
          </>
        )}
      </div>
    </DashboardContainer>
  );
}

