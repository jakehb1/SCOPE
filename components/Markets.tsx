'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Market {
  id: string;
  question: string;
  slug: string;
  endDate: string;
  liquidity: number;
  volume: number;
  url: string;
  createdAt: string;
}

export default function Markets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMarkets() {
      try {
        setLoading(true);
        const response = await fetch('/api/markets?limit=10');
        
        if (!response.ok) {
          throw new Error('Failed to fetch markets');
        }

        const data = await response.json();
        setMarkets(data.markets || []);
        setError(null);
      } catch (err) {
        console.error('Error loading markets:', err);
        setError('Failed to load markets. Please try again later.');
        // Set mock data for development
        setMarkets([
          {
            id: '1',
            question: 'Sample Market Question',
            slug: 'sample-market',
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            liquidity: 50000,
            volume: 120000,
            url: 'https://polymarket.com/event/sample-market',
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadMarkets();
    // Refresh every 60 seconds
    const interval = setInterval(loadMarkets, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section id="markets" className="section-container py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-black mb-8 text-center">
          Markets
        </h2>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
            <p className="mt-4 text-gray-600">Loading markets...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-600">
              Note: API integration is in progress. Showing sample data.
            </p>
          </div>
        )}

        {!loading && !error && markets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No markets available at the moment.</p>
          </div>
        )}

        {!loading && markets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market) => (
              <div
                key={market.id}
                className="bg-white border-2 border-primary-black rounded-lg p-6 hover:border-primary-red transition-all duration-200 hover:shadow-lg"
              >
                <h3 className="text-lg font-bold text-primary-black mb-3 line-clamp-2">
                  {market.question}
                </h3>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium">{formatDate(market.endDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Liquidity:</span>
                    <span className="font-medium">{formatCurrency(market.liquidity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volume:</span>
                    <span className="font-medium">{formatCurrency(market.volume)}</span>
                  </div>
                </div>

                <Link
                  href={market.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full text-center block"
                >
                  View on Polymarket
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

