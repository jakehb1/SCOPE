import { NextResponse } from 'next/server';
import { fetchMarkets } from '@/lib/polymarket-api';

/**
 * API Route to fetch markets
 * This acts as a proxy to the Polymarket API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const markets = await fetchMarkets(limit);
    
    return NextResponse.json(markets, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error in markets API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    );
  }
}

