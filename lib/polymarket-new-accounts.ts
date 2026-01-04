/**
 * Polymarket New Accounts Tracker
 * 
 * Tracks recently created accounts that have made large trades
 */

import { Trade } from '@/types/trade';

export interface NewAccountTrade {
  accountAddress: string;
  accountCreated?: string; // Account creation date if available
  firstTradeDate?: string; // Date of first large trade
  totalTrades: number;
  totalVolume: number;
  largestTrade: Trade;
  recentTrades: Trade[];
}

export interface NewAccountsResponse {
  accounts: NewAccountTrade[];
  total: number;
}

const DATA_API_BASE = 'https://data-api.polymarket.com/v1';

/**
 * Fetch recently created accounts with large trades
 * 
 * Strategy:
 * 1. Fetch recent large trades
 * 2. Group by trader address
 * 3. Try to get account creation dates from leaderboard or user data
 * 4. Filter for accounts created recently (e.g., last 30 days)
 * 5. Sort by total volume or largest trade
 */
export async function fetchNewAccountsWithBigTrades(
  minTradeSize: number = 10000,
  accountAgeDays: number = 30,
  limit: number = 50
): Promise<NewAccountsResponse> {
  try {
    // Step 1: Fetch recent large trades (last 7 days to catch new accounts)
    const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000); // Unix timestamp in seconds
    const now = Math.floor(Date.now() / 1000);
    
    console.log(`🔍 Fetching recent large trades for new accounts analysis...`);
    
    const tradesUrl = `${DATA_API_BASE}/trades?limit=1000&after=${sevenDaysAgo}`;
    const response = await fetch(tradesUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error(`❌ Failed to fetch trades: ${response.status}`);
      return {
        accounts: [],
        total: 0,
      };
    }

    const data = await response.json();
    const rawTrades = Array.isArray(data) ? data : data.trades || data.data || [];
    console.log(`📊 Found ${rawTrades.length} recent trades`);

    // Step 2: Filter large trades and group by trader
    const accountMap = new Map<string, {
      trades: Trade[];
      addresses: Set<string>;
    }>();

    const cutoffDate = new Date(Date.now() - accountAgeDays * 24 * 60 * 60 * 1000);

    for (const item of rawTrades) {
      const size = parseFloat(item.size || item.usdcSize || item.amount || '0') || 0;
      if (size < minTradeSize) continue;

      const traderAddress = item.userAddress || item.taker || item.maker || item.user;
      if (!traderAddress) continue;

      // Parse trade data
      const price = parseFloat(item.price || item.avgPrice || item.fillPrice || '0') || 0;
      const shares = parseFloat(item.shares || item.amount || '0') || 0;
      
      let tradeTime = new Date().toISOString();
      if (item.timestamp || item.time) {
        const timeValue = item.timestamp || item.time;
        if (typeof timeValue === 'number') {
          const timestamp = timeValue > 1000000000000 ? timeValue : timeValue * 1000;
          const parsed = new Date(timestamp);
          if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) {
            tradeTime = parsed.toISOString();
          }
        }
      }

      const trade: Trade = {
        id: item.id || item.transactionHash || `trade_${Date.now()}_${Math.random()}`,
        trader: traderAddress,
        traderAddress: traderAddress,
        market: item.marketQuestion || item.question || item.market || 'Unknown Market',
        marketId: item.conditionId || item.condition_id || '',
        marketSlug: item.marketSlug || item.slug,
        transactionHash: item.transactionHash || item.txHash || item.id,
        shares: shares || (size && price ? size / price : 0),
        investment: size,
        price: price > 1 ? price : price * 100,
        side: (item.side || item.direction || 'buy').toLowerCase().includes('sell') ? 'sell' : 'buy',
        time: tradeTime,
        category: item.category,
        isInsiderLike: false,
      };

      if (!accountMap.has(traderAddress)) {
        accountMap.set(traderAddress, {
          trades: [],
          addresses: new Set([traderAddress]),
        });
      }

      accountMap.get(traderAddress)!.trades.push(trade);
    }

    // Step 3: Try to get account creation dates from leaderboard
    // For accounts not on leaderboard, use first trade date as proxy
    const accounts: NewAccountTrade[] = [];

    for (const [address, data] of accountMap.entries()) {
      // Sort trades by time to find first trade
      const sortedTrades = data.trades.sort((a, b) => 
        new Date(a.time).getTime() - new Date(b.time).getTime()
      );
      
      const firstTrade = sortedTrades[0];
      const firstTradeDate = new Date(firstTrade.time);
      
      // Use first trade date as proxy for account creation if we can't get real creation date
      // If first trade is within the account age window, consider it a new account
      if (firstTradeDate >= cutoffDate) {
        const totalVolume = data.trades.reduce((sum, t) => sum + t.investment, 0);
        const largestTrade = data.trades.reduce((largest, t) => 
          t.investment > largest.investment ? t : largest
        );

        accounts.push({
          accountAddress: address,
          firstTradeDate: firstTrade.time,
          totalTrades: data.trades.length,
          totalVolume: totalVolume,
          largestTrade: largestTrade,
          recentTrades: sortedTrades.slice(-5).reverse(), // Last 5 trades, most recent first
        });
      }
    }

    // Step 4: Sort by total volume (descending)
    accounts.sort((a, b) => b.totalVolume - a.totalVolume);

    console.log(`✅ Found ${accounts.length} new accounts with large trades`);

    return {
      accounts: accounts.slice(0, limit),
      total: accounts.length,
    };
  } catch (error) {
    console.error('❌ Error fetching new accounts:', error);
    return {
      accounts: [],
      total: 0,
    };
  }
}

