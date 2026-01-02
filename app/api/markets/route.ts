import { NextResponse } from 'next/server';
import { fetchMarkets } from '@/lib/polymarket-api';

/**
 * API Route to fetch markets
 * This acts as a proxy to the Polymarket API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    const markets = await fetchMarkets(limit);
    
    return NextResponse.json(markets, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error in markets API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

