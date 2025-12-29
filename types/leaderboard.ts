/**
 * Leaderboard-related type definitions
 */

export interface LeaderboardEntry {
  rank: number;
  proxyWallet: string;
  userName: string | null;
  vol: number; // Trading volume
  pnl: number; // Profit and loss
  profileImage?: string;
  xUsername?: string;
  verifiedBadge?: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
}

export type LeaderboardCategory =
  | 'OVERALL'
  | 'POLITICS'
  | 'SPORTS'
  | 'CRYPTO'
  | 'CULTURE'
  | 'MENTIONS'
  | 'WEATHER'
  | 'ECONOMICS'
  | 'TECH'
  | 'FINANCE';

export type LeaderboardTimePeriod = 'DAY' | 'WEEK' | 'MONTH' | 'ALL';

export type LeaderboardOrderBy = 'PNL' | 'VOL';

