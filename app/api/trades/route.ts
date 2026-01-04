import { NextResponse } from 'next/server';
import { fetchLargeTrades } from '@/lib/polymarket-trades';

/**
 * API Route to fetch large trades from Polymarket
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minAmount = parseFloat(searchParams.get('minAmount') || '10000');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  
  // Support time filtering
  const before = searchParams.get('before') ? parseInt(searchParams.get('before')!, 10) : undefined;
  const after = searchParams.get('after') ? parseInt(searchParams.get('after')!, 10) : undefined;

  try {
    const trades = await fetchLargeTrades(minAmount, limit, before, after);

    return NextResponse.json(trades, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30', // 10 second cache for near real-time
      },
    });
  } catch (error) {
    console.error('Error in trades API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch trades', 
        details: error instanceof Error ? error.message : 'Unknown error',
        trades: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}

