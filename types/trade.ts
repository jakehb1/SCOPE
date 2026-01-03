/**
 * Trade and whale-related type definitions
 */

export interface Trade {
  id: string;
  trader: string;
  traderAddress?: string;
  market: string;
  marketId: string;
  marketSlug?: string; // Market slug for URL construction
  transactionHash?: string; // Transaction hash for direct trade link
  shares: number;
  investment: number;
  price: number;
  side: 'buy' | 'sell';
  time: string;
  category?: string;
  isInsiderLike?: boolean;
}

export interface WhaleStats {
  totalTrades: number;
  whaleVolume: number;
  buyVolume: number;
  sellVolume: number;
  buyPercentage: number;
  sellPercentage: number;
}

export type TradeTypeFilter = 'all' | 'buys' | 'sells';

export interface TradeFilters {
  tradeType: TradeTypeFilter;
  minTradeSize: number; // in USD
  category: string;
  insiderMode: boolean;
}

