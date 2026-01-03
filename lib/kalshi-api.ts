/**
 * Kalshi API Client
 * 
 * Note: Kalshi API may require authentication and may not be publicly available.
 * This is a placeholder implementation that can be extended when API access is available.
 */

export interface KalshiMarket {
  event_ticker: string;
  title: string;
  subtitle?: string;
  category: string;
  yes_bid?: number;
  yes_ask?: number;
  no_bid?: number;
  no_ask?: number;
  last_price?: number;
  volume?: number;
  open_interest?: number;
  url?: string;
}

export interface KalshiResponse {
  markets: KalshiMarket[];
  cursor?: string;
}

/**
 * Fetch markets from Kalshi API
 * 
 * SETUP REQUIRED:
 * 1. Get Kalshi API credentials (if available)
 * 2. Add KALSHI_API_KEY to .env.local
 * 3. Update the API endpoint below to match Kalshi's actual API
 * 
 * Note: Kalshi API may require:
 * - API key authentication
 * - Different endpoint structure
 * - Rate limiting considerations
 * 
 * See KALSHI_API_SETUP.md for detailed instructions
 */
export async function fetchKalshiMarkets(limit: number = 500): Promise<KalshiResponse> {
  const apiKey = process.env.KALSHI_API_KEY;
  
  // If no API key, return empty (arbitrage won't work but won't break)
  if (!apiKey) {
    console.warn('⚠️ KALSHI_API_KEY not set - arbitrage scanner will show no opportunities');
    console.warn('   See KALSHI_API_SETUP.md for setup instructions');
    return {
      markets: [],
    };
  }
  
  try {
    // TODO: Replace with actual Kalshi API endpoint
    // Check Kalshi documentation for the correct endpoint
    // Example endpoints to try:
    // - https://api.kalshi.com/trade-api/v2/events
    // - https://api.kalshi.com/v1/markets
    // - https://trading-api.kalshi.com/trade-api/v2/events
    
    const apiUrl = process.env.KALSHI_API_URL || 'https://api.kalshi.com/trade-api/v2/events';
    
    const response = await fetch(`${apiUrl}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Kalshi API error (${response.status}):`, errorText);
      return {
        markets: [],
      };
    }
    
    const data = await response.json();
    
    // Transform Kalshi API response to our format
    // Adjust this based on Kalshi's actual response structure
    const markets: KalshiMarket[] = (data.events || data.markets || []).map((item: any) => ({
      event_ticker: item.event_ticker || item.ticker || item.id,
      title: item.title || item.question || '',
      subtitle: item.subtitle || item.description || '',
      category: item.category || item.topic || 'other',
      yes_bid: item.yes_bid || item.bid || undefined,
      yes_ask: item.yes_ask || item.ask || undefined,
      no_bid: item.no_bid || undefined,
      no_ask: item.no_ask || undefined,
      last_price: item.last_price || item.price || item.yes_price || undefined,
      volume: item.volume || item.trade_volume || undefined,
      open_interest: item.open_interest || undefined,
      url: item.url || (item.event_ticker ? `https://kalshi.com/markets/${item.event_ticker}` : undefined),
    }));
    
    console.log(`✅ Fetched ${markets.length} markets from Kalshi`);
    
    return {
      markets: markets.slice(0, limit),
    };
  } catch (error) {
    console.error('Error fetching Kalshi markets:', error);
    return {
      markets: [],
    };
  }
}

/**
 * Get the current price for a Kalshi market
 * Uses midpoint of bid/ask if available, otherwise last_price
 */
export function getKalshiPrice(market: KalshiMarket): number {
  // If we have bid and ask, use midpoint
  if (market.yes_bid !== undefined && market.yes_ask !== undefined) {
    return ((market.yes_bid + market.yes_ask) / 2) * 100; // Convert to percentage
  }
  
  // Otherwise use last price
  if (market.last_price !== undefined) {
    return market.last_price * 100; // Convert to percentage
  }
  
  // Default to 50% if no price data
  return 50;
}

