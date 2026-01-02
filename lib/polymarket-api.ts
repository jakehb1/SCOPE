/**
 * Polymarket API Client
 * 
 * This module handles communication with the Polymarket CLOB API
 * to fetch market data, deals, and related information.
 */

import { ClobClient } from '@polymarket/clob-client';
import { Market, MarketsResponse, MarketCategory } from '@/types';

/**
 * Infer category from market question/tags
 * This is a simple heuristic - in production, this would come from the API
 */
function inferCategory(market: any): MarketCategory {
  const question = (market.question || market.title || '').toLowerCase();
  const tags = (market.tags || []).map((t: string) => t.toLowerCase());
  const allText = [...tags, question].join(' ');

  if (allText.includes('election') || allText.includes('president') || allText.includes('senate') || allText.includes('congress') || allText.includes('trump') || allText.includes('biden')) {
    return 'politics';
  }
  if (allText.includes('nfl') || allText.includes('nba') || allText.includes('nhl') || allText.includes('mlb') || allText.includes('ncaab') || allText.includes('ncaa') || allText.includes('soccer') || allText.includes('football') || allText.includes('basketball') || allText.includes('hockey') || allText.includes('baseball')) {
    return 'sports';
  }
  if (allText.includes('bitcoin') || allText.includes('btc') || allText.includes('ethereum') || allText.includes('eth') || allText.includes('crypto') || allText.includes('blockchain') || allText.includes('solana') || allText.includes('sol')) {
    return 'crypto';
  }
  if (allText.includes('stock') || allText.includes('sp500') || allText.includes('dow') || allText.includes('nasdaq') || allText.includes('economy') || allText.includes('fed') || allText.includes('inflation') || allText.includes('gdp') || allText.includes('unemployment')) {
    return 'finance';
  }
  if (allText.includes('tech') || allText.includes('ai') || allText.includes('apple') || allText.includes('google') || allText.includes('meta') || allText.includes('microsoft') || allText.includes('amazon')) {
    return 'tech';
  }
  if (allText.includes('war') || allText.includes('ukraine') || allText.includes('russia') || allText.includes('china') || allText.includes('taiwan') || allText.includes('israel') || allText.includes('palestine') || allText.includes('gaza')) {
    return 'geopolitics';
  }
  if (allText.includes('movie') || allText.includes('tv') || allText.includes('music') || allText.includes('award') || allText.includes('oscar') || allText.includes('grammy') || allText.includes('emmy')) {
    return 'culture';
  }
  
  return 'other';
}

/**
 * Calculate market metrics from tokens
 * Note: For better performance, we use token prices instead of fetching order books
 */
function calculateMarketMetrics(market: any): { liquidity: number; volume: number; yesPrice: number } {
  let liquidity = 0;
  let volume = 0;
  let yesPrice = 50; // Default to 50% if no price data

  if (market.tokens && Array.isArray(market.tokens)) {
    // Calculate liquidity from token balances
    market.tokens.forEach((token: any) => {
      const balance = parseFloat(token.balance || token.total_supply || 0);
      liquidity += balance;
    });

    // Get yes price from tokens
    // For binary markets, first token is usually YES
    const yesToken = market.tokens.find((t: any) => 
      (t.outcome && (t.outcome.toLowerCase().includes('yes') || t.outcome.toLowerCase() === 'yes'))
    ) || market.tokens[0];

    if (yesToken) {
      // Price is typically stored as a decimal (0-1), convert to percentage
      if (yesToken.price !== undefined && yesToken.price !== null) {
        const price = parseFloat(yesToken.price);
        // If price is already 0-100, use as is; if 0-1, multiply by 100
        yesPrice = price > 1 ? price : price * 100;
      } else if (yesToken.last_price !== undefined && yesToken.last_price !== null) {
        const price = parseFloat(yesToken.last_price);
        yesPrice = price > 1 ? price : price * 100;
      }
    }
  }

  // Use direct liquidity/volume if available
  // Check multiple possible volume field names
  if (market.liquidity !== undefined && market.liquidity !== null) {
    liquidity = parseFloat(market.liquidity) || liquidity;
  }
  
  // Try various volume field names that might exist in the CLOB response
  const volumeFields = [
    market.volume,
    market.total_volume,
    market.volume_24h,
    market.volume_7d,
    market.volume_30d,
    market.trade_volume,
    market.total_trade_volume,
  ];
  
  for (const vol of volumeFields) {
    if (vol !== undefined && vol !== null) {
      const parsed = parseFloat(vol);
      if (!isNaN(parsed) && parsed > 0) {
        volume = parsed;
        break;
      }
    }
  }
  
  // If still no volume, try to calculate from token supply (approximation)
  if (volume === 0 && market.tokens && Array.isArray(market.tokens)) {
    // Sum up all token supplies as a rough volume estimate
    let totalSupply = 0;
    market.tokens.forEach((token: any) => {
      const supply = parseFloat(token.total_supply || token.balance || 0);
      if (!isNaN(supply)) {
        totalSupply += supply;
      }
    });
    // Use a fraction of total supply as volume estimate (very rough)
    if (totalSupply > 0) {
      volume = totalSupply * 0.1; // Rough estimate: 10% of supply as volume
    }
  }

  // Ensure yesPrice is between 0 and 100
  yesPrice = Math.max(0, Math.min(100, yesPrice));

  return { liquidity, volume, yesPrice };
}

const CLOB_HOST = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // Polygon mainnet

/**
 * Fetch volumes for multiple markets from Gamma API
 * Uses the events endpoint which is more efficient
 */
async function fetchMarketVolumes(conditionIds: string[]): Promise<Map<string, number>> {
  const volumeMap = new Map<string, number>();
  
  try {
    // Fetch active events from Gamma API (they include volume)
    const response = await fetch(
      `https://gamma-api.polymarket.com/events?closed=false&limit=1000`,
      { 
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 30 } // Cache for 30 seconds
      }
    );
    
    if (!response.ok) {
      return volumeMap;
    }
    
    const events = await response.json();
    
    // Build a map of condition ID to volume
    if (Array.isArray(events)) {
      events.forEach((event: any) => {
        if (event.markets && Array.isArray(event.markets)) {
          event.markets.forEach((market: any) => {
            if (market.conditionId && market.volume !== undefined) {
              const volume = parseFloat(market.volume) || 0;
              volumeMap.set(market.conditionId.toLowerCase(), volume);
            }
          });
        }
      });
    }
  } catch (error) {
    console.debug('Could not fetch volumes from Gamma API:', error);
  }
  
  return volumeMap;
}

/**
 * Fetch price data from CLOB API for multiple markets
 */
async function fetchCLOBPrices(conditionIds: string[]): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();
  
  try {
    const client = new ClobClient(CLOB_HOST, CHAIN_ID);
    const response = await client.getMarkets();
    const clobMarkets = response?.data || [];
    
    // Build a map of condition ID to price
    for (const clobMarket of clobMarkets) {
      if (clobMarket.condition_id && clobMarket.tokens && Array.isArray(clobMarket.tokens)) {
        const conditionId = clobMarket.condition_id.toLowerCase();
        if (conditionIds.includes(conditionId)) {
          const metrics = calculateMarketMetrics(clobMarket);
          if (metrics.yesPrice > 0 && metrics.yesPrice < 100) {
            priceMap.set(conditionId, metrics.yesPrice);
          }
        }
      }
    }
  } catch (error) {
    console.debug('Could not fetch CLOB prices:', error);
  }
  
  return priceMap;
}

/**
 * Fetch markets from Polymarket Gamma API (primary source for active markets with volume)
 * Gets prices from CLOB API in batch
 */
export async function fetchMarkets(limit: number = 1000): Promise<MarketsResponse> {
  try {
    // Use Gamma API for active markets - it has volume data and current markets
    // Fetch events in batches to get more markets (each event can have multiple markets)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for larger fetches
    
    // Gamma API seems to have a max limit around 500-1000 events per request
    // Request enough events to potentially fill our limit (events have multiple markets)
    // Each event typically has 1-5 markets, so we need more events than the limit
    const maxEvents = Math.min(1000, Math.max(500, Math.ceil(limit / 1.5))); // Get enough events
    
    const response = await fetch(
      `https://gamma-api.polymarket.com/events?closed=false&limit=${maxEvents}`,
      { 
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
        next: { revalidate: 30 } // Cache for 30 seconds
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Gamma API returned ${response.status}`);
    }
    
    const events = await response.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      console.warn('No events returned from Gamma API');
      return {
        markets: [],
        total: 0,
      };
    }
    
    // Filter for active markets that haven't ended yet
    const now = new Date();
    const validMarkets: any[] = [];
    const conditionIds: string[] = [];
    
    // First pass: collect ALL valid markets from ALL events
    // We'll slice to the limit after processing everything
    for (const event of events) {
      if (!event.markets || !Array.isArray(event.markets)) continue;
      
      for (const market of event.markets) {
        // Must be active and not closed
        if (market.active !== true || market.closed === true) continue;
        
        // Must have a question and condition ID
        if (!market.question || !market.conditionId) continue;
        
        // Filter out markets that have already ended
        if (market.endDate) {
          try {
            const endDate = new Date(market.endDate);
            // Only include markets that end in the future
            if (endDate.getTime() < now.getTime() - 5 * 60 * 1000) {
              continue;
            }
          } catch (e) {
            console.warn('Could not parse endDate:', market.endDate);
            continue;
          }
        } else {
          continue; // Skip markets without end dates
        }
        
        // Skip archived markets
        if (market.archived === true) {
          continue;
        }
        
        // Don't filter by volume - include all valid markets
        // (new markets may not have volume yet, but are still valid)
        
        validMarkets.push(market);
        conditionIds.push(market.conditionId.toLowerCase());
      }
    }
    
    // Slice to the requested limit after processing all events
    const marketsToProcess = validMarkets.slice(0, limit);
    const conditionIdsToFetch = conditionIds.slice(0, limit);
    
    console.log(`📊 Found ${validMarkets.length} valid markets from ${events.length} events, returning ${marketsToProcess.length}`);
    
    // Fetch prices from CLOB API in batch (only for markets we're returning)
    const priceMap = await fetchCLOBPrices(conditionIdsToFetch);
    
    // Second pass: build Market objects with prices
    // Need to map markets back to their events for URL construction
    const eventMap = new Map<string, string>();
    for (const event of events) {
      if (event.markets && Array.isArray(event.markets)) {
        for (const m of event.markets) {
          if (m.conditionId) {
            eventMap.set(m.conditionId.toLowerCase(), event.slug || '');
          }
        }
      }
    }
    
    const markets: Market[] = marketsToProcess.map((market) => {
      const conditionId = market.conditionId.toLowerCase();
      const liquidity = parseFloat(market.liquidity || '0') || 0;
      const volume = parseFloat(market.volume || '0') || 0;
      const slug = market.slug || market.conditionId;
      
      // Get price from CLOB, or try Gamma API fields, or use lastTradePrice
      let yesPrice = priceMap.get(conditionId) || 50;
      
      // Fallback to Gamma API price fields if CLOB doesn't have it
      if (yesPrice === 50) {
        if (market.lastTradePrice !== undefined && market.lastTradePrice !== null) {
          const price = parseFloat(market.lastTradePrice);
          yesPrice = price > 1 ? price : price * 100;
        } else if (market.bestAsk !== undefined && market.bestAsk !== null) {
          const price = parseFloat(market.bestAsk);
          yesPrice = price > 1 ? price : price * 100;
        }
      }
      
      // Construct URL using event slug and market slug format: /event/{eventSlug}/{marketSlug}
      const eventSlug = eventMap.get(conditionId) || '';
      const marketUrl = (eventSlug && market.slug)
        ? `https://polymarket.com/event/${eventSlug}/${market.slug}`
        : market.slug
        ? `https://polymarket.com/event/${market.slug}`
        : `https://polymarket.com/market/${market.conditionId}`;
      
      return {
        id: market.conditionId,
        question: market.question,
        slug: slug,
        endDate: market.endDate ? new Date(market.endDate).toISOString() : new Date().toISOString(),
        liquidity: liquidity,
        volume: volume,
        url: marketUrl,
        createdAt: market.createdAt || new Date().toISOString(),
        category: inferCategory({ question: market.question, tags: [] }),
        conditionId: market.conditionId,
        yesPrice: yesPrice,
      };
    });

    return {
      markets: markets,
      total: markets.length,
      hasMore: validMarkets.length > limit, // If we found more than the limit, there are more available
    };
  } catch (error) {
    console.error('Error fetching markets from CLOB API:', error);
    
    // Return empty data structure on error
    return {
      markets: [],
      total: 0,
    };
  }
}

/**
 * Fetch a single market by ID or slug
 * Uses Gamma API first (better data), falls back to CLOB
 */
export async function fetchMarket(idOrSlug: string): Promise<Market | null> {
  try {
    // Try Gamma API first for better market data
    const response = await fetch(
      `https://gamma-api.polymarket.com/events?closed=false&limit=1000`,
      { 
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 30 }
      }
    );
    
    if (response.ok) {
      const events = await response.json();
      
      // Search through events and markets
      for (const event of events) {
        if (event.markets && Array.isArray(event.markets)) {
          const market = event.markets.find((m: any) => 
            m.conditionId?.toLowerCase() === idOrSlug.toLowerCase() ||
            m.slug === idOrSlug ||
            m.id === idOrSlug
          );
          
          if (market && market.active && !market.closed) {
            const conditionId = market.conditionId;
            const liquidity = parseFloat(market.liquidity || '0') || 0;
            const volume = parseFloat(market.volume || '0') || 0;
            const slug = market.slug || conditionId;
            
            // Get price from CLOB
            const priceMap = await fetchCLOBPrices([conditionId.toLowerCase()]);
            let yesPrice = priceMap.get(conditionId.toLowerCase()) || 50;
            
            if (yesPrice === 50) {
              if (market.lastTradePrice !== undefined && market.lastTradePrice !== null) {
                const price = parseFloat(market.lastTradePrice);
                yesPrice = price > 1 ? price : price * 100;
              }
            }
            
            // Build URL
            const eventSlug = event.slug || '';
            const marketUrl = (eventSlug && market.slug)
              ? `https://polymarket.com/event/${eventSlug}/${market.slug}`
              : market.slug
              ? `https://polymarket.com/event/${market.slug}`
              : `https://polymarket.com/market/${conditionId}`;
            
            return {
              id: conditionId,
              question: market.question,
              slug: slug,
              endDate: market.endDate ? new Date(market.endDate).toISOString() : new Date().toISOString(),
              liquidity: liquidity,
              volume: volume,
              url: marketUrl,
              createdAt: market.createdAt || new Date().toISOString(),
              category: inferCategory({ question: market.question, tags: [] }),
              conditionId: conditionId,
              yesPrice: yesPrice,
            };
          }
        }
      }
    }
    
    // Fallback to CLOB API
    const client = new ClobClient(CLOB_HOST, CHAIN_ID);
    const clobResponse = await client.getMarkets();
    const marketsArray = clobResponse?.data || [];
    
    const market = marketsArray.find((m: any) => 
      (m.condition_id || m.id) === idOrSlug || 
      (m.market_slug || m.slug) === idOrSlug
    );
    
    if (!market) return null;

    const conditionId = market.condition_id || '';
    const question = market.question || 'Market';
    const slug = market.market_slug || conditionId;
    const { liquidity, volume, yesPrice } = calculateMarketMetrics(market);

    let endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    if (market.end_date_iso) {
      try {
        endDate = new Date(market.end_date_iso).toISOString();
      } catch (e) {
        console.warn('Invalid end_date_iso:', market.end_date_iso);
      }
    }

    return {
      id: conditionId,
      question: question,
      slug: slug,
      endDate: endDate,
      liquidity: liquidity,
      volume: volume,
      url: `https://polymarket.com/event/${slug}`,
      createdAt: market.created_at || new Date().toISOString(),
      category: inferCategory(market),
      conditionId: conditionId,
      yesPrice: yesPrice,
    };
  } catch (error) {
    console.error('Error fetching market:', error);
    return null;
  }
}

/**
 * Fetch newly created markets (recent deals)
 */
export async function fetchNewMarkets(limit: number = 10): Promise<Market[]> {
  try {
    const markets = await fetchMarkets(limit * 2); // Fetch more to sort
    // Sort by createdAt descending to get newest first
    return markets.markets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching new markets:', error);
    return [];
  }
}
