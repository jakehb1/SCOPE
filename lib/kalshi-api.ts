/**
 * Kalshi API Client
 * 
 * Fetches market data from Kalshi using RSA signature authentication
 */

import { generateKalshiAuth, parsePrivateKey } from './kalshi-auth';

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
 * Uses RSA signature-based authentication with key ID and private key
 */
export async function fetchKalshiMarkets(limit: number = 500): Promise<KalshiResponse> {
  const keyId = process.env.KALSHI_KEY_ID;
  const privateKeyString = process.env.KALSHI_PRIVATE_KEY;
  
  // If no credentials, return empty (arbitrage won't work but won't break)
  if (!keyId || !privateKeyString) {
    console.warn('⚠️ Kalshi credentials not set - arbitrage scanner will show no opportunities');
    console.warn('   Set KALSHI_KEY_ID and KALSHI_PRIVATE_KEY in .env.local');
    return {
      markets: [],
    };
  }
  
  try {
    const privateKey = parsePrivateKey(privateKeyString);
    
    // Kalshi API endpoint
    // Based on docs: https://docs.kalshi.com/getting_started/quick_start_websockets
    // REST API base URL (adjust if different)
    const baseUrl = process.env.KALSHI_API_URL || 'https://trading-api.kalshi.com/trade-api/v2';
    const path = '/events';
    const queryParams = new URLSearchParams({ limit: limit.toString() });
    const fullUrl = `${baseUrl}${path}?${queryParams.toString()}`;
    
    // Generate authentication headers
    // Path for signing should NOT include query string
    const authHeaders = generateKalshiAuth('GET', path, '', keyId, privateKey);
    
    console.log(`🔐 Kalshi auth headers generated for path: ${path}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Kalshi API error (${response.status}):`, errorText);
      
      // If 401, authentication failed
      if (response.status === 401) {
        console.error('🔒 Kalshi authentication failed - check your credentials and signature format');
        console.error('   Verify: KALSHI_KEY_ID and KALSHI_PRIVATE_KEY are correct');
        console.error('   Check: Signature uses RSA-PSS with SHA-256');
      }
      
      return {
        markets: [],
      };
    }
    
    const data = await response.json();
    console.log('📦 Kalshi API response structure:', Object.keys(data));
    
    // Transform Kalshi API response to our format
    // Kalshi API may return: { events: [...] } or { data: { events: [...] } } or direct array
    const events = data.events || data.data?.events || (Array.isArray(data) ? data : []);
    
    const markets: KalshiMarket[] = events.map((item: any) => {
      // Handle different possible response structures
      const market = item.market || item;
      
      return {
        event_ticker: market.event_ticker || market.ticker || market.id || '',
        title: market.title || market.question || market.event_title || '',
        subtitle: market.subtitle || market.description || '',
        category: market.category || market.topic || market.series_ticker || 'other',
        yes_bid: market.yes_bid !== undefined ? market.yes_bid : undefined,
        yes_ask: market.yes_ask !== undefined ? market.yes_ask : undefined,
        no_bid: market.no_bid !== undefined ? market.no_bid : undefined,
        no_ask: market.no_ask !== undefined ? market.no_ask : undefined,
        last_price: market.last_price !== undefined 
          ? market.last_price 
          : (market.yes_price !== undefined ? market.yes_price : undefined),
        volume: market.volume || market.trade_volume || undefined,
        open_interest: market.open_interest || undefined,
        url: market.url || (market.event_ticker 
          ? `https://kalshi.com/markets/${market.event_ticker}` 
          : undefined),
      };
    }).filter((m: KalshiMarket) => m.event_ticker && m.title); // Filter out invalid entries
    
    console.log(`✅ Fetched ${markets.length} markets from Kalshi`);
    
    return {
      markets: markets.slice(0, limit),
      cursor: data.cursor || data.next_cursor,
    };
  } catch (error) {
    console.error('Error fetching Kalshi markets:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
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
