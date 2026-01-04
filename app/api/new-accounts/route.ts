import { NextResponse } from 'next/server';
import { fetchNewAccountsWithBigTrades } from '@/lib/polymarket-new-accounts';

/**
 * API Route to fetch recently created accounts with large trades
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minTradeSize = parseFloat(searchParams.get('minTradeSize') || '10000');
    const accountAgeDays = parseInt(searchParams.get('accountAgeDays') || '30', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const accounts = await fetchNewAccountsWithBigTrades(minTradeSize, accountAgeDays, limit);

    return NextResponse.json(accounts, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Error in new accounts API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch new accounts', 
        details: error instanceof Error ? error.message : 'Unknown error',
        accounts: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}

