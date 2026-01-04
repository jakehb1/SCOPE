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
  error?: string;
}

/**
 * Fetch large trades from Polymarket Data API
 * 
 * Uses Polymarket Data API /trades endpoint
 * Docs: https://docs.polymarket.com/api-reference/core/get-trades-for-a-user-or-markets
 */
export async function fetchLargeTrades(
  minAmount: number = 10000,
  limit: number = 50,
  before?: number, // Unix timestamp in seconds
  after?: number   // Unix timestamp in seconds
): Promise<LargeTradesResponse> {
  try {
    // Use Polymarket Data API /activity endpoint with type=TRADE
    // Docs: https://docs.polymarket.com/api-reference/core/get-user-on-chain-activity
    // This endpoint provides user activities including trades
    const params = new URLSearchParams({
      type: 'TRADE',
    });
    
    // Calculate time range - if timeframeMinutes is provided, use it
    // Otherwise default to last 24 hours
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    let startTime = now - (24 * 60 * 60); // Default: 24 hours ago
    
    if (after) {
      startTime = after;
    } else if (before) {
      // If only before is provided, go back 24 hours from before
      startTime = before - (24 * 60 * 60);
    }
    
    params.append('start', startTime.toString());
    if (before) {
      params.append('end', before.toString());
    } else {
      params.append('end', now.toString());
    }

    const activityUrl = `${DATA_API_BASE}/activity?${params.toString()}`;
    console.log(`🔍 Fetching trades from activity endpoint: ${activityUrl}`);
    
    const response = await fetch(activityUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 10 }, // Cache for 10 seconds for near real-time
    });

    console.log(`📡 Activity API response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`📦 Activity API response structure:`, Object.keys(data));
      console.log(`📦 Activity API response sample:`, JSON.stringify(data).substring(0, 1000));
      
      // Activity API returns an array of activities
      const rawActivities = Array.isArray(data) ? data : data.activities || data.data || data.results || [];
      console.log(`📊 Found ${rawActivities.length} raw activities from Activity API`);
      
      // Filter for TRADE type activities and extract trade data
      const rawTrades = rawActivities.filter((item: any) => 
        item.type === 'TRADE' || item.activityType === 'TRADE' || item.kind === 'TRADE'
      );
      console.log(`📊 Filtered to ${rawTrades.length} TRADE activities`);
      
      if (rawTrades.length > 0) {
        const trades: Trade[] = rawTrades.map((item: any) => {
          // Activity API trade structure
          // Fields: proxyWallet, usdcSize, timestamp, conditionId, etc.
          const size = parseFloat(item.usdcSize || item.size || item.amount || item.value || '0') || 0;
          const price = parseFloat(item.price || item.avgPrice || item.fillPrice || item.executionPrice || '0') || 0;
          const shares = parseFloat(item.shares || item.amount || item.quantity || '0') || 0;
          
          // Parse timestamp - Activity API uses Unix timestamps in seconds
          let tradeTime = new Date().toISOString();
          if (item.timestamp || item.time || item.createdAt || item.created_at) {
            const timeValue = item.timestamp || item.time || item.createdAt || item.created_at;
            if (typeof timeValue === 'number') {
              // Unix timestamp - check if seconds or milliseconds
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
          
          // Extract market info from activity
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
            price: price > 1 ? price : price * 100, // Convert to percentage if needed
            side: (item.side || item.direction || item.type || 'buy').toLowerCase().includes('sell') ? 'sell' : 'buy',
            time: tradeTime,
            category: item.category || item.marketCategory || (marketInfo.category || undefined),
            isInsiderLike: false,
          };
        }).filter((trade: Trade) => {
          // Filter out invalid trades
          const tradeDate = new Date(trade.time);
          const isValidDate = !isNaN(tradeDate.getTime()) && tradeDate.getFullYear() >= 2020;
          const hasValidAmount = trade.investment >= minAmount && trade.investment > 0;
          const hasValidPrice = trade.price > 0 && trade.price <= 100;
          const hasValidMarket = trade.market && trade.market !== 'Unknown Market';
          
          const passes = hasValidAmount && hasValidPrice && isValidDate && hasValidMarket;
          
          if (!passes) {
            console.debug(`Filtered out invalid trade:`, {
              id: trade.id,
              date: trade.time,
              year: tradeDate.getFullYear(),
              investment: trade.investment,
              price: trade.price,
              market: trade.market,
            });
          }
          
          return passes;
        });

        if (trades.length > 0) {
          console.log(`✅ Processed ${trades.length} real trades from Activity API`);
          return {
            trades: trades.slice(0, limit),
            total: trades.length,
          };
        }
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Activity API returned ${response.status}: ${errorText.substring(0, 500)}`);
    }

    // Fallback: Try CLOB API endpoints
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
              
              // Parse timestamp correctly - handle both Unix timestamps (seconds or milliseconds) and ISO strings
              let tradeTime = new Date().toISOString();
              if (item.timestamp || item.time || item.createdAt || item.timeCreated) {
                const timeValue = item.timestamp || item.time || item.createdAt || item.timeCreated;
                if (typeof timeValue === 'string') {
                  // ISO string
                  const parsed = new Date(timeValue);
                  if (!isNaN(parsed.getTime())) {
                    tradeTime = parsed.toISOString();
                  }
                } else if (typeof timeValue === 'number') {
                  // Unix timestamp - check if it's seconds or milliseconds
                  const timestamp = timeValue > 1000000000000 ? timeValue : timeValue * 1000; // If less than year 2001, assume seconds
                  const parsed = new Date(timestamp);
                  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2020) {
                    // Only use if it's a reasonable date (after 2020)
                    tradeTime = parsed.toISOString();
                  }
                }
              }
              
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
                time: tradeTime,
                category: item.category || item.marketCategory,
                isInsiderLike: false,
              };
            }).filter((trade: Trade) => {
              // Filter out invalid trades
              const tradeDate = new Date(trade.time);
              const isValidDate = !isNaN(tradeDate.getTime()) && tradeDate.getFullYear() >= 2020;
              const hasValidAmount = trade.investment >= minAmount && trade.investment > 0;
              const hasValidPrice = trade.price > 0 && trade.price <= 100;
              const hasValidId = trade.id && !trade.id.includes('trade_') || trade.transactionHash;
              const hasValidMarket = trade.market && trade.market !== 'Unknown Market';
              
              const passes = hasValidAmount && hasValidPrice && isValidDate && hasValidId && hasValidMarket;
              
              if (!passes) {
                console.debug(`Filtered out invalid trade:`, {
                  id: trade.id,
                  date: trade.time,
                  year: tradeDate.getFullYear(),
                  investment: trade.investment,
                  price: trade.price,
                  market: trade.market,
                });
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

    // Fallback: Try Polymarket Data API alternative endpoints
    const fallbackParams = new URLSearchParams({
      limit: limit.toString(),
    });

    // Note: /trades already tried above, so only try alternative endpoints
    const endpoints = [
      { path: `/fills`, fallbackParams },
      { path: `/transactions`, fallbackParams },
    ];

    for (const { path, fallbackParams: endpointParams } of endpoints) {
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
            
            // Parse timestamp correctly
            let tradeTime = new Date().toISOString();
            if (item.time || item.timestamp || item.created_at || item.time_created) {
              const timeValue = item.time || item.timestamp || item.created_at || item.time_created;
              if (typeof timeValue === 'string') {
                const parsed = new Date(timeValue);
                if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) {
                  tradeTime = parsed.toISOString();
                }
              } else if (typeof timeValue === 'number') {
                const timestamp = timeValue > 1000000000000 ? timeValue : timeValue * 1000;
                const parsed = new Date(timestamp);
                if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) {
                  tradeTime = parsed.toISOString();
                }
              }
            }
            
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
              time: tradeTime,
              category: item.category || item.market_category || undefined,
              isInsiderLike: item.is_insider || item.insider || false,
            };
          }).filter((trade: Trade) => {
            // Filter out invalid trades
            const tradeDate = new Date(trade.time);
            const isValidDate = !isNaN(tradeDate.getTime()) && tradeDate.getFullYear() >= 2020;
            const hasValidAmount = trade.investment >= minAmount && trade.investment > 0;
            const hasValidPrice = trade.price > 0 && trade.price <= 100;
            const hasValidMarket = trade.market && trade.market !== 'Unknown Market';
            
            const passes = trade.id && hasValidAmount && hasValidPrice && isValidDate && hasValidMarket;
            
            if (!passes) {
              console.debug(`Filtered out invalid trade:`, {
                id: trade.id,
                date: trade.time,
                year: tradeDate.getFullYear(),
                investment: trade.investment,
                price: trade.price,
                market: trade.market,
              });
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

    // If no endpoint works, Polymarket trades API is not publicly available
    // Trades require authentication or WebSocket connection
    console.warn('⚠️ Could not fetch real trades from Polymarket API');
    console.warn('   Polymarket trades API requires authentication or WebSocket connection');
    console.warn('   REST API endpoints for trades are not publicly available');
    return {
      trades: [],
      total: 0,
      error: 'Trades API not available - requires authentication or WebSocket',
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

