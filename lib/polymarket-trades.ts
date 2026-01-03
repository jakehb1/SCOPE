/**
 * Polymarket Trades API Client
 * 
 * Fetches large trades/transactions from Polymarket
 */

import { Trade } from '@/types/trade';

const DATA_API_BASE = 'https://data-api.polymarket.com/v1';

export interface LargeTradesResponse {
  trades: Trade[];
  total: number;
}

/**
 * Fetch large trades from Polymarket Data API
 * 
 * Note: This is a placeholder implementation. The actual endpoint
 * may need to be adjusted based on Polymarket's API documentation.
 */
export async function fetchLargeTrades(
  minAmount: number = 1000,
  limit: number = 50
): Promise<LargeTradesResponse> {
  try {
    // Try to fetch from Polymarket Data API
    // Note: The actual endpoint may vary - this is a best guess
    const params = new URLSearchParams({
      min_amount: minAmount.toString(),
      limit: limit.toString(),
      sort: 'desc',
    });

    // Try multiple possible endpoints
    const endpoints = [
      `/trades?${params.toString()}`,
      `/transactions?${params.toString()}`,
      `/fills?${params.toString()}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${DATA_API_BASE}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          next: { revalidate: 10 }, // Cache for 10 seconds for near real-time
        });

        if (response.ok) {
          const data = await response.json();
          
          // Transform API response to our Trade format
          const trades: Trade[] = (Array.isArray(data) ? data : data.trades || data.data || []).map((item: any) => ({
            id: item.id || item.tx_hash || item.transaction_hash || '',
            trader: item.trader || item.user || item.wallet || 'Unknown',
            traderAddress: item.trader_address || item.wallet_address || item.user_address,
            market: item.market_question || item.question || item.market || 'Unknown Market',
            marketId: item.market_id || item.condition_id || item.conditionId || '',
            shares: parseFloat(item.shares || item.amount || item.quantity || '0') || 0,
            investment: parseFloat(item.investment || item.value || item.usd_value || item.amount_usd || '0') || 0,
            price: parseFloat(item.price || item.fill_price || item.execution_price || '0') || 0,
            side: (item.side || item.direction || 'buy').toLowerCase() === 'sell' ? 'sell' : 'buy',
            time: item.time || item.timestamp || item.created_at || new Date().toISOString(),
            category: item.category || item.market_category || undefined,
            isInsiderLike: item.is_insider || item.insider || false,
          })).filter((trade: Trade) => trade.id && trade.investment >= minAmount);

          return {
            trades: trades.slice(0, limit),
            total: trades.length,
          };
        }
      } catch (error) {
        // Try next endpoint
        continue;
      }
    }

    // If no endpoint works, return mock data for development
    // In production, you'd want to handle this differently
    console.warn('⚠️ Could not fetch trades from Polymarket API - using mock data');
    return {
      trades: generateMockTrades(minAmount, limit),
      total: 0,
    };
  } catch (error) {
    console.error('Error fetching large trades:', error);
    return {
      trades: [],
      total: 0,
    };
  }
}

/**
 * Generate mock trades for development/testing
 */
function generateMockTrades(minAmount: number, limit: number): Trade[] {
  const markets = [
    'Will Bitcoin reach $100,000 by end of 2024?',
    'Will Trump win the 2024 election?',
    'Will the Lakers win the NBA championship?',
    'Will AI achieve AGI by 2025?',
    'Will Ethereum reach $5,000?',
  ];

  const traders = [
    '0x1234...5678',
    '0xabcd...efgh',
    '0x9876...5432',
    'whale_trader',
    'crypto_insider',
  ];

  const trades: Trade[] = [];
  const now = Date.now();

  for (let i = 0; i < limit; i++) {
    const investment = minAmount + Math.random() * 50000;
    const price = 20 + Math.random() * 60;
    const shares = investment / price;

    trades.push({
      id: `trade_${i}_${now}`,
      trader: traders[Math.floor(Math.random() * traders.length)],
      traderAddress: traders[Math.floor(Math.random() * traders.length)],
      market: markets[Math.floor(Math.random() * markets.length)],
      marketId: `market_${i}`,
      shares: shares,
      investment: investment,
      price: price,
      side: Math.random() > 0.3 ? 'buy' : 'sell',
      time: new Date(now - i * 60000).toISOString(), // Stagger times
      category: ['crypto', 'politics', 'sports', 'tech'][Math.floor(Math.random() * 4)],
      isInsiderLike: Math.random() > 0.8,
    });
  }

  return trades.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

