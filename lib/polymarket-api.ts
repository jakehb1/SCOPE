/**
 * Polymarket API Client
 * 
 * This module handles communication with the Polymarket API
 * to fetch market data, deals, and related information.
 */

export interface Market {
  id: string;
  question: string;
  slug: string;
  endDate: string;
  liquidity: number;
  volume: number;
  url: string;
  createdAt: string;
}

export interface MarketsResponse {
  markets: Market[];
  total: number;
}

const POLYMARKET_API_BASE = process.env.NEXT_PUBLIC_POLYMARKET_API_URL || 'https://api.polymarket.com';

/**
 * Fetch markets from Polymarket API
 * This is a placeholder implementation that will be updated
 * once we have the exact API endpoints and authentication requirements
 */
export async function fetchMarkets(limit: number = 20): Promise<MarketsResponse> {
  try {
    // TODO: Replace with actual Polymarket API endpoint
    // Common endpoints might be:
    // - GraphQL: https://api.polymarket.com/graphql
    // - REST: https://api.polymarket.com/v2/markets
    // - CLOB API: https://clob.polymarket.com/...
    
    const response = await fetch(`${POLYMARKET_API_BASE}/markets?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add API key if required
        // 'Authorization': `Bearer ${process.env.POLYMARKET_API_KEY}`,
      },
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching markets:', error);
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
    const response = await fetch(`${POLYMARKET_API_BASE}/markets/${idOrSlug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
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
    const markets = await fetchMarkets(limit);
    // Sort by createdAt descending to get newest first
    return markets.markets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching new markets:', error);
    return [];
  }
}

