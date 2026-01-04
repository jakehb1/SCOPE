/**
 * Polymarket New Accounts Tracker
 * 
 * Tracks recently created accounts that have made large trades
 */

import { Trade } from '@/types/trade';

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
    // Step 1: Fetch recent large trades using activity endpoint
    // Look back enough days to catch new accounts (accountAgeDays + buffer)
    const lookbackDays = Math.max(accountAgeDays + 7, 30); // At least 30 days
    const startTime = Math.floor((Date.now() - lookbackDays * 24 * 60 * 60 * 1000) / 1000); // Unix timestamp in seconds
    const endTime = Math.floor(Date.now() / 1000);
    
    console.log(`🔍 Fetching recent large trades for new accounts analysis (last ${lookbackDays} days)...`);
    
    // Use activity endpoint with type=TRADE
    const activityUrl = `${DATA_API_BASE}/activity?type=TRADE&start=${startTime}&end=${endTime}`;
    const response = await fetch(activityUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch activity: ${response.status} - ${errorText.substring(0, 200)}`);
      return {
        accounts: [],
        total: 0,
      };
    }

    const data = await response.json();
    // Activity API returns array of activities
    const rawActivities = Array.isArray(data) ? data : data.activities || data.data || [];
    // Filter for TRADE type
    const rawTrades = rawActivities.filter((item: any) => 
      item.type === 'TRADE' || item.activityType === 'TRADE' || item.kind === 'TRADE'
    );
    console.log(`📊 Found ${rawTrades.length} recent trade activities`);

    // Step 2: Filter large trades and group by trader
    const accountMap = new Map<string, {
      trades: Trade[];
      addresses: Set<string>;
    }>();

    const cutoffDate = new Date(Date.now() - accountAgeDays * 24 * 60 * 60 * 1000);

    for (const item of rawTrades) {
      // Activity API uses usdcSize for trade size
      const size = parseFloat(item.usdcSize || item.size || item.amount || item.value || '0') || 0;
      if (size < minTradeSize) continue;

      // Activity API uses proxyWallet for user address
      const traderAddress = item.proxyWallet || item.proxy_wallet || item.userAddress || item.taker || item.maker || item.user;
      if (!traderAddress) continue;

      // Parse trade data
      const price = parseFloat(item.price || item.avgPrice || item.fillPrice || item.executionPrice || '0') || 0;
      const shares = parseFloat(item.shares || item.amount || item.quantity || '0') || 0;
      
      // Parse timestamp - Activity API uses Unix timestamps in seconds
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

      const trade: Trade = {
        id: item.id || item.transactionHash || item.txHash || `trade_${Date.now()}_${Math.random()}`,
        trader: item.userName || item.user || traderAddress,
        traderAddress: traderAddress,
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

      if (!accountMap.has(traderAddress)) {
        accountMap.set(traderAddress, {
          trades: [],
          addresses: new Set([traderAddress]),
        });
      }

      accountMap.get(traderAddress)!.trades.push(trade);
    }

    // Step 3: Identify new accounts based on first trade date
    const accounts: NewAccountEntry[] = [];
    const now = new Date();

    for (const [address, data] of accountMap.entries()) {
      // Sort trades by time to find first trade
      const sortedTrades = data.trades.sort((a, b) => 
        new Date(a.time).getTime() - new Date(b.time).getTime()
      );
      
      const firstTrade = sortedTrades[0];
      const firstTradeDate = new Date(firstTrade.time);
      
      // Calculate account age in days
      const ageMs = now.getTime() - firstTradeDate.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      
      // If account age is within the specified window, consider it a new account
      if (ageDays <= accountAgeDays) {
        const totalVolume = data.trades.reduce((sum, t) => sum + t.investment, 0);
        const largestTrade = data.trades.reduce((largest, t) => 
          t.investment > largest.investment ? t : largest
        );

        accounts.push({
          traderAddress: address,
          trader: firstTrade.trader || address.substring(0, 6) + '...' + address.substring(address.length - 4),
          firstTradeTime: firstTrade.time,
          totalVolume: totalVolume,
          totalTrades: data.trades.length,
          largestTrade: largestTrade,
          recentTrades: sortedTrades.slice(-5).reverse(), // Last 5 trades, most recent first
          accountAgeDays: parseFloat(ageDays.toFixed(1)),
          profileUrl: `https://polymarket.com/profile/${address}`,
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

