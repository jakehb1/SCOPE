/**
 * Polymarket New Accounts Tracker
 * 
 * Tracks recently created accounts that have made large trades
 * Note: Activity API requires user parameter, so we aggregate trades from traders
 */

import { Trade } from '@/types/trade';
import { fetchLeaderboard } from './polymarket-leaderboard';

export interface NewAccountEntry {
  traderAddress: string;
  trader: string;
  firstTradeTime: string;
  totalVolume: number;
  totalTrades: number;
  largestTrade: Trade;
  recentTrades: Trade[];
  accountAgeDays: number;
  profileUrl: string;
}

export interface NewAccountsResponse {
  accounts: NewAccountEntry[];
  total: number;
  error?: string;
}

const DATA_API_BASE = 'https://data-api.polymarket.com/v1';

/**
 * Fetch trades for a specific user from Polymarket Activity API
 */
async function fetchUserTrades(
  userAddress: string,
  minTradeSize: number,
  lookbackDays: number
): Promise<Trade[]> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const startTime = now - (lookbackDays * 24 * 60 * 60);

    const params = new URLSearchParams({
      user: userAddress,
      type: 'TRADE',
      start: startTime.toString(),
      end: now.toString(),
    });

    const activityUrl = `${DATA_API_BASE}/activity?${params.toString()}`;
    const response = await fetch(activityUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const rawActivities = Array.isArray(data) ? data : data.activities || data.data || [];
    const rawTrades = rawActivities.filter((item: any) => 
      item.type === 'TRADE' || item.activityType === 'TRADE' || item.kind === 'TRADE'
    );

    const trades: Trade[] = rawTrades.map((item: any) => {
      const size = parseFloat(item.usdcSize || item.size || item.amount || item.value || '0') || 0;
      const price = parseFloat(item.price || item.avgPrice || item.fillPrice || item.executionPrice || '0') || 0;
      const shares = parseFloat(item.shares || item.amount || item.quantity || '0') || 0;
      
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

      const marketInfo = item.market || item.marketQuestion || item.question || {};
      const marketTitle = typeof marketInfo === 'string' 
        ? marketInfo 
        : (marketInfo.title || marketInfo.question || marketInfo.name || 'Unknown Market');

      return {
        id: item.id || item.transactionHash || item.txHash || `trade_${Date.now()}_${Math.random()}`,
        trader: item.userName || item.user || userAddress,
        traderAddress: userAddress,
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
      const hasValidAmount = trade.investment >= minTradeSize && trade.investment > 0;
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
 * Fetch recently created accounts with large trades
 * 
 * Since the Activity API requires a user parameter, we:
 * 1. Get traders from leaderboard
 * 2. Fetch their trades to determine account age (first trade date)
 * 3. Filter for accounts created within accountAgeDays
 */
export async function fetchNewAccountsWithBigTrades(
  minTradeSize: number = 10000,
  accountAgeDays: number = 30,
  limit: number = 50
): Promise<NewAccountsResponse> {
  try {
    // Get more traders from leaderboard to find new accounts
    const lookbackDays = Math.max(accountAgeDays + 7, 30);
    const leaderboardResponse = await fetchLeaderboard('OVERALL', 'MONTH', 'VOL', 50, 0);
    const traders = leaderboardResponse.entries.slice(0, 40); // Limit to top 40
    
    if (traders.length === 0) {
      console.warn('⚠️ No traders found from leaderboard');
      return {
        accounts: [],
        total: 0,
        error: 'No traders found',
      };
    }

    console.log(`🔍 Fetching trades from ${traders.length} traders to find new accounts...`);

    const accountsMap = new Map<string, {
      trades: Trade[];
    }>();

    const cutoffDate = new Date(Date.now() - accountAgeDays * 24 * 60 * 60 * 1000);

    // Fetch trades for each trader (in batches to avoid rate limits)
    const batchSize = 5;
    for (let i = 0; i < traders.length; i += batchSize) {
      const batch = traders.slice(i, i + batchSize);
      const batchPromises = batch.map(trader => 
        fetchUserTrades(trader.proxyWallet, minTradeSize, lookbackDays)
      );
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((trades, index) => {
        const trader = batch[index];
        if (trades.length > 0) {
          accountsMap.set(trader.proxyWallet, { trades });
        }
      });
    }

    // Process accounts to find new ones
    const newAccounts: NewAccountEntry[] = [];
    const now = Date.now();

    for (const [traderAddress, accountData] of accountsMap.entries()) {
      if (accountData.trades.length === 0) continue;

      // Find first trade
      const sortedTrades = [...accountData.trades].sort((a, b) => 
        new Date(a.time).getTime() - new Date(b.time).getTime()
      );
      const firstTrade = sortedTrades[0];
      const firstTradeTime = new Date(firstTrade.time);

      // Check if account is new (first trade within accountAgeDays)
      if (firstTradeTime >= cutoffDate) {
        const totalVolume = accountData.trades.reduce((sum, trade) => sum + trade.investment, 0);
        const largestTrade = accountData.trades.reduce((largest, trade) => 
          trade.investment > largest.investment ? trade : largest
        );
        
        const recentTrades = [...accountData.trades]
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 5);

        const ageDays = (now - firstTradeTime.getTime()) / (1000 * 60 * 60 * 24);
        const trader = traders.find(t => t.proxyWallet === traderAddress);

        newAccounts.push({
          traderAddress,
          trader: trader?.userName || traderAddress.substring(0, 8) + '...',
          firstTradeTime: firstTradeTime.toISOString(),
          totalVolume,
          totalTrades: accountData.trades.length,
          largestTrade,
          recentTrades,
          accountAgeDays: parseFloat(ageDays.toFixed(1)),
          profileUrl: `https://polymarket.com/profile/${traderAddress}`,
        });
      }
    }

    // Sort by total volume (highest first)
    newAccounts.sort((a, b) => b.totalVolume - a.totalVolume);

    console.log(`✅ Found ${newAccounts.length} new accounts with large trades`);

    return {
      accounts: newAccounts.slice(0, limit),
      total: newAccounts.length,
    };
  } catch (error) {
    console.error('❌ Error fetching new accounts:', error);
    return {
      accounts: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
