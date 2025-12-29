/**
 * Arbitrage-related type definitions
 */

export interface ArbitrageOpportunity {
  id: string;
  event: string;
  polymarketUrl: string;
  kalshiUrl?: string;
  polymarketPrice: number;
  kalshiPrice?: number;
  spread: number; // positive = profitable
  spreadPercentage: number;
  category: string;
  lastUpdated: string;
}

export interface ArbitrageStats {
  opportunitiesFound: number;
  averageSpread: number;
  bestSpread: number;
  lastUpdated: string;
}

export type ArbitrageCategory =
  | 'all'
  | 'sports'
  | 'politics'
  | 'crypto'
  | 'nfl'
  | 'nba'
  | 'nhl'
  | 'mlb'
  | 'cfb'
  | 'cbb';

