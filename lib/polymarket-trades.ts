/**
 * Polymarket Trades API Client
 * 
 * Fetches large trades/transactions from Polymarket using CLOB API
 */

import { ClobClient } from '@polymarket/clob-client';
import { Trade } from '@/types/trade';

const CLOB_HOST = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // Polygon mainnet
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
  minAmount: number = 10000,
  limit: number = 50
): Promise<LargeTradesResponse> {
  try {
    // Try CLOB API first (recommended approach)
    try {
      const client = new ClobClient(CLOB_HOST, CHAIN_ID);
      
      // Try to get trades from CLOB API
      // Note: CLOB API might not have a direct trades endpoint
      // We'll try the data API endpoints as fallback
      console.log('🔍 Attempting to fetch trades from CLOB API...');
    } catch (clobError) {
      console.debug('CLOB client error:', clobError);
    }

    // Try CLOB API /data/trades endpoint (recommended for real trades)
    try {
      const client = new ClobClient(CLOB_HOST, CHAIN_ID);
      // CLOB API endpoint for trades
      const clobTradesUrl = `${CLOB_HOST}/data/trades?limit=${limit}`;
      console.log(`🔍 Trying CLOB trades endpoint: ${clobTradesUrl}`);
      
      const clobResponse = await fetch(clobTradesUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        next: { revalidate: 10 },
      });

      if (clobResponse.ok) {
        const clobData = await clobResponse.json();
        console.log(`📦 CLOB response structure:`, Object.keys(clobData));
        
        const rawTrades = Array.isArray(clobData) ? clobData : clobData.trades || clobData.data || [];
        console.log(`📊 Found ${rawTrades.length} trades from CLOB API`);
        
        if (rawTrades.length > 0) {
          const trades: Trade[] = rawTrades.map((item: any) => {
            // CLOB API trade structure
            const usdcSize = parseFloat(item.usdcSize || item.size || '0') || 0;
            const price = parseFloat(item.price || item.avgPrice || '0') || 0;
            const shares = parseFloat(item.shares || item.amount || '0') || 0;
            
            return {
              id: item.id || item.transactionHash || item.txHash || `trade_${Date.now()}_${Math.random()}`,
              trader: item.taker || item.maker || item.user || 'Unknown',
              traderAddress: item.taker || item.maker || item.userAddress,
              market: item.marketQuestion || item.question || item.market || 'Unknown Market',
              marketId: item.conditionId || item.condition_id || item.marketId || '',
              marketSlug: item.marketSlug || item.slug,
              transactionHash: item.transactionHash || item.txHash || item.id,
              shares: shares || (usdcSize && price ? usdcSize / price : 0),
              investment: usdcSize,
              price: price > 1 ? price : price * 100,
              side: (item.side || item.direction || 'buy').toLowerCase().includes('sell') ? 'sell' : 'buy',
              time: item.timestamp || item.time || item.createdAt || new Date().toISOString(),
              category: item.category,
              isInsiderLike: false,
            };
          }).filter((trade: Trade) => trade.id && trade.investment >= minAmount);

          if (trades.length > 0) {
            console.log(`✅ Processed ${trades.length} real trades from CLOB API`);
            return {
              trades: trades.slice(0, limit),
              total: trades.length,
            };
          }
        }
      } else {
        const errorText = await clobResponse.text();
        console.log(`❌ CLOB trades endpoint returned ${clobResponse.status}: ${errorText.substring(0, 200)}`);
      }
    } catch (clobError) {
      console.debug('CLOB trades endpoint error:', clobError);
    }

    // Fallback: Try Polymarket Data API endpoints
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    const endpoints = [
      { path: `/trades`, params },
      { path: `/fills`, params },
      { path: `/transactions`, params },
    ];

    for (const { path, params: endpointParams } of endpoints) {
      try {
        const url = `${DATA_API_BASE}${path}?${endpointParams.toString()}`;
        console.log(`🔍 Trying endpoint: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          next: { revalidate: 10 }, // Cache for 10 seconds for near real-time
        });

        console.log(`📡 Response status: ${response.status} for ${path}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`📦 Response structure:`, Object.keys(data));
          console.log(`📦 Sample data:`, JSON.stringify(data).substring(0, 500));
          
          // Transform API response to our Trade format
          const rawTrades = Array.isArray(data) ? data : data.trades || data.data || data.results || [];
          console.log(`📊 Found ${rawTrades.length} raw trades`);
          
          const trades: Trade[] = rawTrades.map((item: any) => {
            const investment = parseFloat(item.investment || item.value || item.usd_value || item.amount_usd || item.size || '0') || 0;
            const price = parseFloat(item.price || item.fill_price || item.execution_price || item.avg_price || '0') || 0;
            const shares = parseFloat(item.shares || item.amount || item.quantity || item.size || '0') || 0;
            
            return {
              id: item.id || item.tx_hash || item.transaction_hash || item.fill_id || `trade_${Date.now()}_${Math.random()}`,
              trader: item.trader || item.user || item.wallet || item.user_address || 'Unknown',
              traderAddress: item.trader_address || item.wallet_address || item.user_address || item.trader,
              market: item.market_question || item.question || item.market || item.market_title || 'Unknown Market',
              marketId: item.market_id || item.condition_id || item.conditionId || item.condition_id || '',
              marketSlug: item.market_slug || item.slug,
              transactionHash: item.transaction_hash || item.tx_hash || item.transactionHash || item.id,
              shares: shares,
              investment: investment,
              price: price > 1 ? price : price * 100, // Convert to percentage if needed
              side: (item.side || item.direction || item.type || 'buy').toLowerCase().includes('sell') ? 'sell' : 'buy',
              time: item.time || item.timestamp || item.created_at || item.time_created || new Date().toISOString(),
              category: item.category || item.market_category || undefined,
              isInsiderLike: item.is_insider || item.insider || false,
            };
          }).filter((trade: Trade) => {
            // Filter by minimum amount
            const passes = trade.id && trade.investment >= minAmount;
            if (!passes && trade.investment > 0) {
              console.debug(`Filtered out trade: ${trade.id} - investment: $${trade.investment} < min: $${minAmount}`);
            }
            return passes;
          });

          console.log(`✅ Processed ${trades.length} trades meeting minimum of $${minAmount}`);

          if (trades.length > 0) {
            return {
              trades: trades.slice(0, limit),
              total: trades.length,
            };
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ Endpoint ${path} returned ${response.status}: ${errorText.substring(0, 200)}`);
        }
      } catch (error) {
        console.debug(`Error trying ${path}:`, error);
        // Try next endpoint
        continue;
      }
    }

    // If no endpoint works, we can't return mock data for real transactions
    // Return empty array instead - user should see that no trades are available
    console.warn('⚠️ Could not fetch real trades from Polymarket API');
    console.warn('   All endpoints failed - trades API may require authentication or different endpoint');
    return {
      trades: [],
      total: 0,
    };
  } catch (error) {
    console.error('❌ Error fetching large trades:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    // Return empty on error - we want real trades only
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

