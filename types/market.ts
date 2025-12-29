/**
 * Market-related type definitions
 */

export interface Market {
  id: string;
  question: string;
  slug: string;
  endDate: string;
  liquidity: number;
  volume: number;
  url: string;
  createdAt: string;
  category?: MarketCategory;
  conditionId?: string;
  imageUrl?: string;
  yesPrice?: number; // Yes token price as percentage (0-100)
}

export type MarketCategory =
  | 'all'
  | 'politics'
  | 'sports'
  | 'crypto'
  | 'finance'
  | 'tech'
  | 'culture'
  | 'geopolitics'
  | 'other'
  | 'uncategorized';

export type MarketSortOption = 'volume' | 'newest' | 'ending_soon';

export interface MarketContext {
  marketId: string;
  summary: string;
  keyDates: string[];
  keyFactors: string[];
  relatedLinks?: Array<{ title: string; url: string }>;
  generatedAt: string;
}

export interface MarketsResponse {
  markets: Market[];
  total: number;
  page?: number;
  hasMore?: boolean;
}

