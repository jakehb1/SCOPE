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

    // Try CLOB API endpoints for trades
    // Note: Polymarket's trades API may require authentication or use different endpoints
    const clobEndpoints = [
      `${CLOB_HOST}/data/trades`,
      `${CLOB_HOST}/trades`,
      `${CLOB_HOST}/fills`,
    ];

    for (const endpoint of clobEndpoints) {
      try {
        const url = `${endpoint}?limit=${limit}`;
        console.log(`🔍 Trying CLOB endpoint: ${url}`);
        
        const clobResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          next: { revalidate: 10 },
        });

        console.log(`📡 CLOB response status: ${clobResponse.status} for ${endpoint}`);

        if (clobResponse.ok) {
          const clobData = await clobResponse.json();
          console.log(`📦 CLOB response keys:`, Object.keys(clobData));
          console.log(`📦 CLOB response sample:`, JSON.stringify(clobData).substring(0, 1000));
          
          const rawTrades = Array.isArray(clobData) ? clobData : clobData.trades || clobData.data || clobData.results || clobData.fills || [];
          console.log(`📊 Found ${rawTrades.length} raw trades from ${endpoint}`);
          
          if (rawTrades.length > 0) {
            const trades: Trade[] = rawTrades.map((item: any) => {
              // Try various field names for trade data
              const usdcSize = parseFloat(item.usdcSize || item.size || item.amount || item.value || item.usdValue || '0') || 0;
              const price = parseFloat(item.price || item.avgPrice || item.fillPrice || item.executionPrice || '0') || 0;
              const shares = parseFloat(item.shares || item.amount || item.quantity || '0') || 0;
              
              return {
                id: item.id || item.transactionHash || item.txHash || item.fillId || item.orderId || `trade_${Date.now()}_${Math.random()}`,
                trader: item.taker || item.maker || item.user || item.trader || item.userAddress || 'Unknown',
                traderAddress: item.taker || item.maker || item.userAddress || item.traderAddress || item.user,
                market: item.marketQuestion || item.question || item.market || item.marketTitle || 'Unknown Market',
                marketId: item.conditionId || item.condition_id || item.marketId || item.conditionId || '',
                marketSlug: item.marketSlug || item.slug || item.marketSlug,
                transactionHash: item.transactionHash || item.txHash || item.id || item.transactionId,
                shares: shares || (usdcSize && price ? usdcSize / price : 0),
                investment: usdcSize,
                price: price > 1 ? price : price * 100,
                side: (item.side || item.direction || item.type || 'buy').toLowerCase().includes('sell') ? 'sell' : 'buy',
                time: item.timestamp || item.time || item.createdAt || item.timeCreated || new Date().toISOString(),
                category: item.category || item.marketCategory,
                isInsiderLike: false,
              };
            }).filter((trade: Trade) => {
              const passes = trade.id && trade.investment >= minAmount;
              if (!passes && trade.investment > 0) {
                console.debug(`Filtered: ${trade.id} - $${trade.investment} < $${minAmount}`);
              }
              return passes;
            });

            if (trades.length > 0) {
              console.log(`✅ Processed ${trades.length} real trades from ${endpoint}`);
              return {
                trades: trades.slice(0, limit),
                total: trades.length,
              };
            }
          }
        } else {
          const errorText = await clobResponse.text();
          console.log(`❌ ${endpoint} returned ${clobResponse.status}: ${errorText.substring(0, 200)}`);
        }
      } catch (clobError) {
        console.debug(`Error trying ${endpoint}:`, clobError);
        continue;
      }
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

// Note: Mock data generation removed - we only want real trades

