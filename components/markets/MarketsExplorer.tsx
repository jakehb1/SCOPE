'use client';

import { useState, useEffect } from 'react';
import { Market, MarketCategory, MarketSortOption } from '@/types';
import MarketCard from '@/components/shared/MarketCard';
import MarketContextModal from '@/components/shared/MarketContextModal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const MARKETS_PER_PAGE = 20;

export default function MarketsExplorer() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<MarketCategory>('all');
  const [sortBy, setSortBy] = useState<MarketSortOption>('volume');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedCount, setDisplayedCount] = useState(MARKETS_PER_PAGE);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch markets
  useEffect(() => {
    async function loadMarkets() {
      try {
        setLoading(true);
        setError(null);
        // Fetch markets with a reasonable limit for performance
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
        
        const response = await fetch('/api/markets?limit=200', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Failed to fetch markets');
        }

        const data = await response.json();
        setMarkets(data.markets || []);
      } catch (err) {
        console.error('Error loading markets:', err);
        setError('Failed to load markets. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadMarkets();
    
    // Refresh markets every 60 seconds for live updates
    const interval = setInterval(loadMarkets, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort markets
  useEffect(() => {
    let filtered = [...markets];

    // Apply search filter - search in question, description, and tags
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((market) => {
        const question = market.question.toLowerCase();
        const slug = market.slug.toLowerCase();
        const category = market.category?.toLowerCase() || '';
        
        // Search in question, slug, and category
        return question.includes(query) || 
               slug.includes(query) || 
               category.includes(query);
      });
    }

    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter((market) => market.category === category);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.volume - a.volume;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'ending_soon':
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        default:
          return 0;
      }
    });

    setFilteredMarkets(filtered);
    setDisplayedCount(MARKETS_PER_PAGE);
  }, [markets, category, sortBy, searchQuery]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount((prev) => prev + MARKETS_PER_PAGE);
      setLoadingMore(false);
    }, 300);
  };

  const handleViewContext = (market: Market) => {
    setSelectedMarket(market);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMarket(null);
  };

  const displayedMarkets = filteredMarkets.slice(0, displayedCount);
  const hasMore = displayedCount < filteredMarkets.length;

  const categories: { value: MarketCategory; label: string }[] = [
    { value: 'all', label: 'all' },
    { value: 'politics', label: 'politics' },
    { value: 'sports', label: 'sports' },
    { value: 'crypto', label: 'crypto' },
    { value: 'finance', label: 'finance' },
    { value: 'tech', label: 'tech' },
    { value: 'culture', label: 'culture' },
    { value: 'geopolitics', label: 'geopolitics' },
    { value: 'other', label: 'other' },
  ];

  const sortOptions: { value: MarketSortOption; label: string }[] = [
    { value: 'volume', label: 'volume' },
    { value: 'newest', label: 'newest' },
    { value: 'ending_soon', label: 'ending soon' },
  ];

  return (
    <div className="section-container py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
          {/* Title and Subtitle */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">markets</h1>
            <p className="text-white opacity-90">browse and track prediction markets from polymarket</p>
          </div>

          {/* Sorting Buttons */}
          <div className="flex items-center gap-3">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  sortBy === option.value
                    ? 'bg-white text-primary-red'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-full border-2 border-white focus:outline-none focus:border-primary-black text-primary-black"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-6">
          <p className="text-white text-sm font-medium mb-3 uppercase tracking-wide">FILTER BY CATEGORY</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  category === cat.value
                    ? 'bg-white text-primary-red'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-4 text-white opacity-90">Loading markets...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-white mb-4">{error}</p>
        </div>
      )}

      {/* Results Count */}
      {!loading && !error && markets.length > 0 && (
        <div className="mb-4 text-white opacity-90 text-sm">
          Showing {displayedMarkets.length} of {filteredMarkets.length} markets
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}

      {/* Markets Grid */}
      {!loading && !error && (
        <>
          {displayedMarkets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white opacity-90">
                {searchQuery 
                  ? `No markets found matching "${searchQuery}". Try a different search term.`
                  : 'No markets found matching your filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {displayedMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  onViewContext={handleViewContext}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-white text-primary-red px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-all duration-200"
              >
                {loadingMore ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Loading...</span>
                  </>
                ) : (
                  'Load More Markets'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Market Context Modal */}
      <MarketContextModal
        market={selectedMarket}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
