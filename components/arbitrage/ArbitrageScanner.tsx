'use client';

import { useState, useEffect } from 'react';
import { ArbitrageOpportunity, ArbitrageStats, ArbitrageCategory } from '@/types/arbitrage';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const ARBITRAGE_CATEGORIES: { value: ArbitrageCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sports', label: 'Sports' },
  { value: 'politics', label: 'Politics' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'nfl', label: 'NFL' },
  { value: 'nba', label: 'NBA' },
  { value: 'nhl', label: 'NHL' },
  { value: 'mlb', label: 'MLB' },
  { value: 'cfb', label: 'CFB' },
  { value: 'cbb', label: 'CBB' },
];

export default function ArbitrageScanner() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [stats, setStats] = useState<ArbitrageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ArbitrageCategory>('all');
  const [isConnected, setIsConnected] = useState(true);

  // Fetch arbitrage opportunities
  useEffect(() => {
    async function loadOpportunities() {
      try {
        setLoading(true);
        setError(null);
        setIsConnected(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        const response = await fetch(`/api/arbitrage?category=${category}&limit=100`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to fetch arbitrage opportunities');
        }

        const data = await response.json();
        setOpportunities(data.opportunities || []);
        setStats(data.stats || null);
      } catch (err: any) {
        console.error('Error loading arbitrage opportunities:', err);
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError('Failed to load arbitrage opportunities. Please try again later.');
        }
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    }

    loadOpportunities();

    // Auto-refresh every 45 seconds
    const interval = setInterval(loadOpportunities, 45000);
    return () => clearInterval(interval);
  }, [category]);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatSpread = (spread: number): string => {
    const sign = spread >= 0 ? '+' : '';
    return `${sign}${spread.toFixed(2)}%`;
  };

  return (
    <div className="section-container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary-black mb-2">Arbitrage Scanner</h1>
            <p className="text-primary-black opacity-90">Find price discrepancies between Polymarket and Kalshi</p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-primary-black text-sm">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="text-primary-black opacity-70 text-sm mb-1">Opportunities</div>
              <div className="text-primary-black text-2xl font-bold">{stats.opportunitiesFound}</div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="text-primary-black opacity-70 text-sm mb-1">Avg Spread</div>
              <div className="text-primary-black text-2xl font-bold">{formatSpread(stats.averageSpread)}</div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="text-primary-black opacity-70 text-sm mb-1">Best Spread</div>
              <div className={`text-2xl font-bold ${stats.bestSpread > 0 ? 'text-green-600' : 'text-primary-black'}`}>
                {formatSpread(stats.bestSpread)}
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="text-primary-black opacity-70 text-sm mb-1">Last Updated</div>
              <div className="text-primary-black text-sm">
                {new Date(stats.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="mb-6">
          <p className="text-primary-black text-sm font-medium mb-3 uppercase tracking-wide">FILTER BY CATEGORY</p>
          <div className="flex flex-wrap gap-2">
            {ARBITRAGE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  category === cat.value
                    ? 'bg-primary-black text-primary-offwhite'
                    : 'bg-white bg-opacity-20 text-primary-black hover:bg-opacity-30'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-4 mb-6">
        <p className="text-yellow-200 text-sm">
          <strong>Disclaimer:</strong> Arbitrage opportunities are calculated based on current prices and estimated fees (Polymarket ~2%, Kalshi ~10%). 
          Actual execution may vary due to slippage, liquidity constraints, and timing. Always verify prices and fees before trading. 
          This tool is for informational purposes only and does not constitute financial advice.
        </p>
      </div>

      {/* How Arbitrage Works */}
      <details className="mb-6">
        <summary className="text-primary-black cursor-pointer font-medium mb-2">How Arbitrage Works</summary>
        <div className="bg-white bg-opacity-10 rounded-lg p-4 mt-2 text-primary-black text-sm">
          <p className="mb-2">
            Arbitrage is the practice of buying an asset on one platform and selling it on another to profit from price differences.
          </p>
          <p className="mb-2">
            <strong>Example:</strong> If a market trades at 60% on Polymarket and 70% on Kalshi, you could:
          </p>
          <ul className="list-disc list-inside ml-4 mb-2">
            <li>Buy YES shares on Polymarket at 60%</li>
            <li>Sell YES shares on Kalshi at 70%</li>
            <li>Profit from the 10% difference (minus fees)</li>
          </ul>
          <p>
            <strong>Important:</strong> You need accounts on both platforms and sufficient funds. Prices can change quickly, 
            so opportunities may disappear before execution. Always account for fees, slippage, and execution time.
          </p>
        </div>
      </details>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-4 text-primary-black opacity-90">Scanning for opportunities...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-primary-black mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-black text-primary-offwhite px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* Opportunities Table */}
      {!loading && !error && (
        <>
          {opportunities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-primary-black opacity-90 mb-2">No arbitrage opportunities found.</p>
              <p className="text-primary-black opacity-70 text-sm">
                {category !== 'all' 
                  ? 'Try selecting a different category or check back later.'
                  : 'Opportunities may be rare. Check back periodically as prices change.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Polymarket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kalshi
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Spread
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {opportunities.map((opp) => (
                      <tr 
                        key={opp.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => window.open(opp.polymarketUrl, '_blank')}
                        tabIndex={0}
                        role="link"
                        aria-label={`View ${opp.event} on Polymarket`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            window.open(opp.polymarketUrl, '_blank');
                          }
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-primary-black group-hover:text-primary-grey transition-colors">
                            {opp.event}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {opp.category}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-primary-black">
                            {opp.polymarketPrice.toFixed(1)}%
                          </div>
                          <div className="text-xs text-primary-grey">
                            Polymarket
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {opp.kalshiPrice ? (
                            <>
                              <div className="text-sm text-primary-black">
                                {opp.kalshiPrice.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500">
                                Kalshi
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-400">N/A</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div
                            className={`text-sm font-bold ${
                              opp.spread > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatSpread(opp.spreadPercentage)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {opp.spread > 0 ? 'Profitable' : 'Loss'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs text-primary-grey font-medium">
                              View →
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
