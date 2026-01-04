/**
 * Copy Trading type definitions
 */

export interface TraderPosition {
  conditionId: string;
  marketQuestion: string;
  marketSlug?: string;
  outcome: 'YES' | 'NO';
  shares: number;
  avgPrice: number;
  currentPrice?: number;
  pnl?: number;
  pnlPercentage?: number;
  lastUpdated: string;
}

export interface TrackedTrader {
  proxyWallet: string;
  userName: string | null;
  profileImage?: string;
  xUsername?: string;
  verifiedBadge?: boolean;
  // Stats from leaderboard
  rank?: number;
  vol: number;
  pnl: number;
  // Current positions
  positions: TraderPosition[];
  totalPositions: number;
  totalValue: number;
  // Recent activity
  recentTrades?: number; // Count of recent trades
  lastActivity?: string;
}

export interface CopyTradingResponse {
  traders: TrackedTrader[];
  total: number;
  lastUpdated: string;
}

export interface PositionChange {
  conditionId: string;
  marketQuestion: string;
  changeType: 'OPENED' | 'CLOSED' | 'INCREASED' | 'DECREASED';
  oldShares?: number;
  newShares: number;
  price: number;
  timestamp: string;
}

