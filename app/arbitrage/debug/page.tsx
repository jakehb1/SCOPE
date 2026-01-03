'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import DashboardContainer from '@/components/shared/DashboardContainer';

interface DebugInfo {
  timestamp: string;
  credentials: {
    hasKeyId: boolean;
    hasPrivateKey: boolean;
    keyIdLength: number;
  };
  markets: {
    polymarketCount: number;
    kalshiCount: number;
    hasPolymarketMarkets: boolean;
    hasKalshiMarkets: boolean;
  };
  opportunities: {
    found: number;
    profitable: number;
  };
  samples: {
    polymarket: {
      question: string;
      yesPrice: number;
      category: string;
    } | null;
    kalshi: {
      title: string;
      price: number;
      category: string;
      event_ticker: string;
    } | null;
  };
  analysis: {
    possibleIssues: string[];
  };
}

export default function ArbitrageDebugPage() {
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDebug() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/arbitrage?debug=true&limit=100');
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.debug) {
          setDebug(data.debug);
        } else {
          throw new Error('No debug information in response');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load debug information');
      } finally {
        setLoading(false);
      }
    }

    fetchDebug();
  }, []);

  return (
    <DashboardContainer
      title="Arbitrage Debug"
      subtitle="Diagnostic information for the arbitrage scanner"
    >
      <div className="space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-primary-black">Loading debug information...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {debug && (
          <div className="space-y-6">
            {/* Timestamp */}
            <div className="text-sm text-primary-grey">
              Last updated: {new Date(debug.timestamp).toLocaleString()}
            </div>

            {/* Credentials Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-primary-black mb-4">Credentials Status</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-primary-grey mb-1">Kalshi Key ID</div>
                  <div className={`font-semibold ${debug.credentials.hasKeyId ? 'text-green-600' : 'text-red-600'}`}>
                    {debug.credentials.hasKeyId ? '✓ Set' : '✗ Missing'}
                  </div>
                  {debug.credentials.hasKeyId && (
                    <div className="text-xs text-primary-grey mt-1">
                      Length: {debug.credentials.keyIdLength} characters
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-primary-grey mb-1">Kalshi Private Key</div>
                  <div className={`font-semibold ${debug.credentials.hasPrivateKey ? 'text-green-600' : 'text-red-600'}`}>
                    {debug.credentials.hasPrivateKey ? '✓ Set' : '✗ Missing'}
                  </div>
                  {debug.credentials.hasPrivateKey && (
                    <div className="text-xs text-primary-grey mt-1">
                      Length: {debug.credentials.privateKeyLength} characters
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Markets Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-primary-black mb-4">Markets Status</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-primary-grey mb-1">Polymarket Markets</div>
                  <div className={`text-2xl font-bold ${debug.markets.hasPolymarketMarkets ? 'text-green-600' : 'text-red-600'}`}>
                    {debug.markets.polymarketCount}
                  </div>
                  <div className="text-xs text-primary-grey mt-1">
                    {debug.markets.hasPolymarketMarkets ? '✓ Markets available' : '✗ No markets'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-primary-grey mb-1">Kalshi Markets</div>
                  <div className={`text-2xl font-bold ${debug.markets.hasKalshiMarkets ? 'text-green-600' : 'text-red-600'}`}>
                    {debug.markets.kalshiCount}
                  </div>
                  <div className="text-xs text-primary-grey mt-1">
                    {debug.markets.hasKalshiMarkets ? '✓ Markets available' : '✗ No markets'}
                  </div>
                </div>
              </div>
            </div>

            {/* Opportunities Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-primary-black mb-4">Opportunities Status</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-primary-grey mb-1">Total Opportunities</div>
                  <div className={`text-2xl font-bold ${debug.opportunities.found > 0 ? 'text-green-600' : 'text-primary-black'}`}>
                    {debug.opportunities.found}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-primary-grey mb-1">Profitable Opportunities</div>
                  <div className={`text-2xl font-bold ${debug.opportunities.profitable > 0 ? 'text-green-600' : 'text-primary-black'}`}>
                    {debug.opportunities.profitable}
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Markets */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-primary-black mb-4">Sample Markets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {debug.samples.polymarket ? (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-semibold text-primary-grey mb-2">Polymarket Sample</div>
                    <div className="text-primary-black font-medium mb-1">{debug.samples.polymarket.question}</div>
                    <div className="text-sm text-primary-grey">
                      Price: {debug.samples.polymarket.yesPrice.toFixed(2)}% | Category: {debug.samples.polymarket.category}
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 text-center text-primary-grey">
                    No Polymarket markets available
                  </div>
                )}
                
                {debug.samples.kalshi ? (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-semibold text-primary-grey mb-2">Kalshi Sample</div>
                    <div className="text-primary-black font-medium mb-1">{debug.samples.kalshi.title}</div>
                    <div className="text-sm text-primary-grey">
                      Price: {debug.samples.kalshi.price.toFixed(2)}% | Category: {debug.samples.kalshi.category}
                    </div>
                    <div className="text-xs text-primary-grey mt-1">
                      Ticker: {debug.samples.kalshi.event_ticker}
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 text-center text-primary-grey">
                    No Kalshi markets available
                  </div>
                )}
              </div>
            </div>

            {/* Possible Issues */}
            {debug.analysis.possibleIssues.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-yellow-800 mb-4">⚠️ Possible Issues</h2>
                <ul className="list-disc list-inside space-y-2">
                  {debug.analysis.possibleIssues.map((issue, index) => (
                    <li key={index} className="text-yellow-700">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Message */}
            {debug.analysis.possibleIssues.length === 0 && debug.opportunities.found > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-green-800 mb-2">✓ Everything Looks Good!</h2>
                <p className="text-green-700">
                  Arbitrage scanner is working correctly. Found {debug.opportunities.found} opportunities.
                </p>
              </div>
            )}

            {/* Refresh Button */}
            <div className="flex justify-end">
              <button
                onClick={() => window.location.reload()}
                className="bg-primary-black text-primary-offwhite px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-all"
              >
                Refresh Debug Info
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardContainer>
  );
}

