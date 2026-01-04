/**
 * Polymarket Trades API Client
 * 
 * Fetches large trades/transactions from Polymarket
 * Note: Activity API requires user parameter, so we aggregate trades from top traders
 */

import { ClobClient } from '@polymarket/clob-client';
import { Trade } from '@/types/trade';
import { fetchLeaderboard } from './polymarket-leaderboard';

const CLOB_HOST = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // Polygon mainnet
const DATA_API_BASE = 'https://data-api.polymarket.com/v1';

export interface LargeTradesResponse {
  trades: Trade[];
  total: number;
  error?: string;
}

/**
 * Fetch trades for a specific user from Polymarket Activity API
 * 
 * The Activity API requires a user parameter
 */
async function fetchUserTrades(
  userAddress: string,
  minAmount: number,
  after?: number,
  before?: number
): Promise<Trade[]> {
  try {
    const params = new URLSearchParams({
      user: userAddress,
      type: 'TRADE',
    });
    
    const now = Math.floor(Date.now() / 1000);
    if (after) {
      params.append('start', after.toString());
    } else {
      params.append('start', (now - 24 * 60 * 60).toString()); // Last 24 hours
    }
    
    if (before) {
      params.append('end', before.toString());
    } else {
      params.append('end', now.toString());
    }

    const activityUrl = `${DATA_API_BASE}/activity?${params.toString()}`;
    const response = await fetch(activityUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const rawActivities = Array.isArray(data) ? data : data.activities || data.data || [];
    const rawTrades = rawActivities.filter((item: any) => 
      item.type === 'TRADE' || item.activityType === 'TRADE' || item.kind === 'TRADE'
    );
    
    if (rawTrades.length === 0) {
      return [];
    }

    const trades: Trade[] = rawTrades.map((item: any) => {
      const size = parseFloat(item.usdcSize || item.size || item.amount || item.value || '0') || 0;
      const price = parseFloat(item.price || item.avgPrice || item.fillPrice || item.executionPrice || '0') || 0;
      const shares = parseFloat(item.shares || item.amount || item.quantity || '0') || 0;
      
      // Parse timestamp
      let tradeTime = new Date().toISOString();
      if (item.timestamp || item.time || item.createdAt || item.created_at) {
        const timeValue = item.timestamp || item.time || item.createdAt || item.created_at;
        if (typeof timeValue === 'number') {
          const timestamp = timeValue > 1000000000000 ? timeValue : timeValue * 1000;
          const parsed = new Date(timestamp);
          if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) {
            tradeTime = parsed.toISOString();
          }
        } else if (typeof timeValue === 'string') {
          const parsed = new Date(timeValue);
          if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) {
            tradeTime = parsed.toISOString();
          }
        }
      }
      
      // Extract market info
      const marketInfo = item.market || item.marketQuestion || item.question || {};
      const marketTitle = typeof marketInfo === 'string' 
        ? marketInfo 
        : (marketInfo.title || marketInfo.question || marketInfo.name || 'Unknown Market');
      
      return {
        id: item.id || item.transactionHash || item.txHash || item.fillId || `trade_${Date.now()}_${Math.random()}`,
        trader: item.userName || item.user || item.taker || item.maker || item.trader || 'Unknown',
        traderAddress: item.proxyWallet || item.proxy_wallet || item.userAddress || item.taker || item.maker || item.user || item.walletAddress,
        market: marketTitle,
        marketId: item.conditionId || item.condition_id || item.marketId || '',
        marketSlug: item.marketSlug || item.slug || (marketInfo.slug || undefined),
        transactionHash: item.transactionHash || item.txHash || item.id || item.transaction_id,
        shares: shares || (size && price ? size / price : 0),
        investment: size,
        price: price > 1 ? price : price * 100,
        side: (item.side || item.direction || item.type || 'buy').toLowerCase().includes('sell') ? 'sell' : 'buy',
        time: tradeTime,
        category: item.category || item.marketCategory || (marketInfo.category || undefined),
        isInsiderLike: false,
      };
    }).filter((trade: Trade) => {
      const tradeDate = new Date(trade.time);
      const isValidDate = !isNaN(tradeDate.getTime()) && tradeDate.getFullYear() >= 2020;
      const hasValidAmount = trade.investment >= minAmount && trade.investment > 0;
      const hasValidPrice = trade.price > 0 && trade.price <= 100;
      const hasValidMarket = trade.market && trade.market !== 'Unknown Market';
      
      return hasValidAmount && hasValidPrice && isValidDate && hasValidMarket;
    });

    return trades;
  } catch (error) {
    console.debug(`Error fetching trades for user ${userAddress.substring(0, 8)}...:`, error);
    return [];
  }
}

/**
 * Fetch large trades from Polymarket by aggregating trades from top traders
 * 
 * Since the Activity API requires a user parameter, we:
 * 1. Get top traders from leaderboard (by volume to get active traders)
 * 2. Fetch recent trades for each trader
 * 3. Aggregate all trades and filter by minAmount
 */
export async function fetchLargeTrades(
  minAmount: number = 10000,
  limit: number = 50,
  before?: number, // Unix timestamp in seconds
  after?: number   // Unix timestamp in seconds
): Promise<LargeTradesResponse> {
  try {
    // Get top traders from leaderboard (by volume to get active traders)
    const leaderboardResponse = await fetchLeaderboard('OVERALL', 'MONTH', 'VOL', 30, 0);
    const topTraders = leaderboardResponse.entries.slice(0, 20); // Limit to top 20 to avoid rate limits
    
    if (topTraders.length === 0) {
      console.warn('⚠️ No traders found from leaderboard');
      return {
        trades: [],
        total: 0,
        error: 'No traders found',
      };
    }

    console.log(`🔍 Fetching trades from ${topTraders.length} top traders...`);

    // Fetch trades for each trader in parallel (but limit concurrency)
    const allTrades: Trade[] = [];
    const batchSize = 5; // Process 5 traders at a time to avoid overwhelming the API
    
    for (let i = 0; i < topTraders.length; i += batchSize) {
      const batch = topTraders.slice(i, i + batchSize);
      const batchPromises = batch.map(trader => 
        fetchUserTrades(trader.proxyWallet, minAmount, after, before)
      );
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(trades => {
        allTrades.push(...trades);
      });
    }

    // Sort by time (most recent first) and filter by time range if needed
    let filteredTrades = allTrades.sort((a, b) => 
      new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    // Apply time filters if specified
    if (after || before) {
      const afterDate = after ? new Date(after * 1000) : null;
      const beforeDate = before ? new Date(before * 1000) : null;
      
      filteredTrades = filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.time);
        if (afterDate && tradeDate < afterDate) return false;
        if (beforeDate && tradeDate > beforeDate) return false;
        return true;
      });
    }

    // Remove duplicates (same transaction hash)
    const uniqueTrades = Array.from(
      new Map(filteredTrades.map(trade => [trade.transactionHash || trade.id, trade])).values()
    );

    // Sort by investment amount (largest first) within the same time
    uniqueTrades.sort((a, b) => {
      const timeDiff = new Date(b.time).getTime() - new Date(a.time).getTime();
      if (Math.abs(timeDiff) < 60000) { // Within 1 minute, sort by investment
        return b.investment - a.investment;
      }
      return timeDiff;
    });

    console.log(`✅ Found ${uniqueTrades.length} unique large trades from ${topTraders.length} traders`);

    return {
      trades: uniqueTrades.slice(0, limit),
      total: uniqueTrades.length,
    };
  } catch (error) {
    console.error('❌ Error fetching large trades:', error);
    return {
      trades: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Note: Mock data generation removed - we only want real trades
