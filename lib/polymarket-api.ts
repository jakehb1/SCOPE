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
 * Calculate market metrics from tokens and order book
 */
function calculateMarketMetrics(market: any) {
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
    // Look for YES token or first token with price
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
      } else if (yesToken.best_bid || yesToken.best_ask) {
        // Use best bid/ask midpoint if available
        const bid = parseFloat(yesToken.best_bid || 0);
        const ask = parseFloat(yesToken.best_ask || 0);
        if (bid > 0 || ask > 0) {
          const midPrice = ask > 0 && bid > 0 ? (bid + ask) / 2 : (ask || bid);
          yesPrice = midPrice > 1 ? midPrice : midPrice * 100;
        }
      }
    }
  }

  // Use direct liquidity/volume if available
  if (market.liquidity) {
    liquidity = parseFloat(market.liquidity) || liquidity;
  }
  if (market.volume) {
    volume = parseFloat(market.volume) || volume;
  }
  if (market.total_volume) {
    volume = parseFloat(market.total_volume) || volume;
  }

  // Ensure yesPrice is between 0 and 100
  yesPrice = Math.max(0, Math.min(100, yesPrice));

  return { liquidity, volume, yesPrice };
}

const CLOB_HOST = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // Polygon mainnet

/**
 * Fetch markets from Polymarket CLOB API
 */
export async function fetchMarkets(limit: number = 100): Promise<MarketsResponse> {
  try {
    // Initialize CLOB client (read-only, no signer needed for fetching markets)
    const client = new ClobClient(CLOB_HOST, CHAIN_ID);
    
    // Fetch markets from CLOB API
    const response = await client.getMarkets();
    
    // CLOB returns { data: Market[], next_cursor: string, limit: number, count: number }
    const marketsArray = response?.data || [];
    
    if (!Array.isArray(marketsArray) || marketsArray.length === 0) {
      console.warn('No markets returned from CLOB API');
      return {
        markets: [],
        total: 0,
      };
    }
    
    // Transform CLOB response to our Market interface
    const markets: Market[] = marketsArray
      .slice(0, limit)
      .map((market: any) => {
        const conditionId = market.condition_id || '';
        const question = market.question || 'Market';
        const slug = market.market_slug || conditionId;
        const { liquidity, volume, yesPrice } = calculateMarketMetrics(market);
        
        // Parse end date
        let endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        if (market.end_date_iso) {
          try {
            endDate = new Date(market.end_date_iso).toISOString();
          } catch (e) {
            console.warn('Invalid end_date_iso:', market.end_date_iso);
          }
        }

        // Parse created date (use current time if not available)
        let createdAt = new Date().toISOString();
        if (market.created_at) {
          try {
            createdAt = new Date(market.created_at).toISOString();
          } catch (e) {
            // Use current time as fallback
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
          createdAt: createdAt,
          category: inferCategory(market),
          conditionId: conditionId,
          // Store yes price for display
          yesPrice: yesPrice,
        };
      });

    return {
      markets,
      total: markets.length,
      hasMore: response?.next_cursor ? true : false,
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
 */
export async function fetchMarket(idOrSlug: string): Promise<Market | null> {
  try {
    const client = new ClobClient(CLOB_HOST, CHAIN_ID);
    const response = await client.getMarkets();
    const marketsArray = response?.data || [];
    
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
