/**
 * Polymarket Leaderboard API Client
 * 
 * Fetches leaderboard data from Polymarket Data API
 */

import {
  LeaderboardEntry,
  LeaderboardResponse,
  LeaderboardCategory,
  LeaderboardTimePeriod,
  LeaderboardOrderBy,
} from '@/types/leaderboard';

const DATA_API_BASE = 'https://data-api.polymarket.com/v1';

/**
 * Fetch leaderboard data from Polymarket Data API
 */
export async function fetchLeaderboard(
  category: LeaderboardCategory = 'OVERALL',
  timePeriod: LeaderboardTimePeriod = 'MONTH',
  orderBy: LeaderboardOrderBy = 'PNL',
  limit: number = 50,
  offset: number = 0
): Promise<LeaderboardResponse> {
  try {
    const params = new URLSearchParams({
      category,
      timePeriod,
      orderBy,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${DATA_API_BASE}/leaderboard?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response is an array
    if (!Array.isArray(data)) {
      console.error('Invalid leaderboard API response format:', data);
      return {
        entries: [],
        total: 0,
      };
    }

    // Transform API response to our interface
    const entries: LeaderboardEntry[] = data
      .filter((entry: any) => entry && entry.proxyWallet) // Filter out invalid entries
      .map((entry: any) => ({
        rank: parseInt(entry.rank || '0', 10),
        proxyWallet: entry.proxyWallet || entry.proxy_wallet || '',
        userName: entry.userName || entry.user_name || null,
        vol: parseFloat(entry.vol || entry.volume || '0') || 0,
        pnl: parseFloat(entry.pnl || entry.profit_loss || '0') || 0,
        profileImage: entry.profileImage || entry.profile_image || undefined,
        xUsername: entry.xUsername || entry.x_username || entry.twitter_username || undefined,
        verifiedBadge: entry.verifiedBadge || entry.verified_badge || false,
      }))
      .filter((entry: LeaderboardEntry) => entry.proxyWallet.length > 0); // Ensure we have a valid wallet

    return {
      entries,
      total: entries.length,
    };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      entries: [],
      total: 0,
    };
  }
}

