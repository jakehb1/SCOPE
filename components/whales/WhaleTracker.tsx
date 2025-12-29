'use client';

import { useState, useEffect } from 'react';
import {
  LeaderboardEntry,
  LeaderboardCategory,
  LeaderboardTimePeriod,
  LeaderboardOrderBy,
} from '@/types/leaderboard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function WhaleTracker() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<LeaderboardCategory>('OVERALL');
  const [timePeriod, setTimePeriod] = useState<LeaderboardTimePeriod>('MONTH');
  const [orderBy, setOrderBy] = useState<LeaderboardOrderBy>('PNL');

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          category,
          timePeriod,
          orderBy,
          limit: '50',
        });
        const response = await fetch(`/api/leaderboard?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const data = await response.json();
        setEntries(data.entries || []);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [category, timePeriod, orderBy]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getProfileUrl = (entry: LeaderboardEntry) => {
    // Use username if available, otherwise use wallet address
    if (entry.userName) {
      return `https://polymarket.com/profile/${entry.userName}`;
    }
    return `https://polymarket.com/profile/${entry.proxyWallet}`;
  };

  const categories: { value: LeaderboardCategory; label: string }[] = [
    { value: 'OVERALL', label: 'All Categories' },
    { value: 'POLITICS', label: 'Politics' },
    { value: 'SPORTS', label: 'Sports' },
    { value: 'CRYPTO', label: 'Crypto' },
    { value: 'FINANCE', label: 'Finance' },
    { value: 'TECH', label: 'Tech' },
    { value: 'CULTURE', label: 'Culture' },
  ];

  const timePeriods: { value: LeaderboardTimePeriod; label: string }[] = [
    { value: 'DAY', label: 'Today' },
    { value: 'WEEK', label: 'Weekly' },
    { value: 'MONTH', label: 'Monthly' },
    { value: 'ALL', label: 'All Time' },
  ];

  return (
    <div className="section-container py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Whale Leaderboard</h1>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <label className="text-white font-medium">Category:</label>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                category === cat.value
                  ? 'bg-white text-primary-red'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="text-white font-medium">Time Period:</label>
          {timePeriods.map((period) => (
            <button
              key={period.value}
              onClick={() => setTimePeriod(period.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timePeriod === period.value
                  ? 'bg-white text-primary-red'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="text-white font-medium">Sort By:</label>
          <button
            onClick={() => setOrderBy('PNL')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              orderBy === 'PNL'
                ? 'bg-white text-primary-red'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            Profit/Loss
          </button>
          <button
            onClick={() => setOrderBy('VOL')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              orderBy === 'VOL'
                ? 'bg-white text-primary-red'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            Volume
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-4 text-white opacity-90">Loading leaderboard...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-white mb-4">{error}</p>
        </div>
      )}

      {/* Leaderboard Table */}
      {!loading && !error && entries.length > 0 && (
        <div className="bg-white rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary-black">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary-black">Trader</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-black">Profit/Loss</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-black">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry) => {
                  const profileUrl = getProfileUrl(entry);
                  return (
                    <tr
                      key={entry.proxyWallet}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => window.open(profileUrl, '_blank', 'noopener,noreferrer')}
                      title={`View ${entry.userName || entry.proxyWallet}'s profile on Polymarket`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          window.open(profileUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-primary-black">
                        {entry.rank}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {entry.profileImage && (
                            <img
                              src={entry.profileImage}
                              alt={entry.userName || 'Trader'}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-primary-black hover:text-primary-red transition-colors">
                              {entry.userName || entry.proxyWallet.slice(0, 8) + '...'}
                              {entry.verifiedBadge && (
                                <span className="ml-2 text-primary-red">✓</span>
                              )}
                            </div>
                            {entry.xUsername && (
                              <div className="text-xs text-gray-500">@{entry.xUsername}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-bold ${
                        entry.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.pnl >= 0 ? '+' : ''}{formatCurrency(entry.pnl)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        {formatCurrency(entry.vol)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white opacity-90">No leaderboard data available.</p>
        </div>
      )}
    </div>
  );
}
