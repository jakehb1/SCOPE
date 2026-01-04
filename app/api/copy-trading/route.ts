import { NextResponse } from 'next/server';
import { fetchLeaderboard } from '@/lib/polymarket-leaderboard';
import { fetchMultipleTraderPositions, buildTrackedTraders } from '@/lib/polymarket-positions';
import { CopyTradingResponse } from '@/types/copy-trading';

/**
 * API Route to fetch tracked traders and their positions
 * 
 * This endpoint:
 * 1. Fetches top traders from leaderboard
 * 2. Fetches their current positions
 * 3. Combines the data into TrackedTrader objects
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10); // Default to top 10 traders
    const category = searchParams.get('category') || 'OVERALL';
    const timePeriod = searchParams.get('timePeriod') || 'MONTH';
    
    // Step 1: Fetch top traders from leaderboard
    console.log(`📊 Fetching top ${limit} traders from leaderboard...`);
    const leaderboardResponse = await fetchLeaderboard(
      category as any,
      timePeriod as any,
      'PNL', // Order by P&L
      limit,
      0
    );
    
    if (leaderboardResponse.entries.length === 0) {
      return NextResponse.json({
        traders: [],
        total: 0,
        lastUpdated: new Date().toISOString(),
      });
    }
    
    // Step 2: Fetch positions for all traders
    console.log(`🔍 Fetching positions for ${leaderboardResponse.entries.length} traders...`);
    const positionsMap = await fetchMultipleTraderPositions(leaderboardResponse.entries);
    
    // Step 3: Build TrackedTrader objects
    const trackedTraders = buildTrackedTraders(leaderboardResponse.entries, positionsMap);
    
    // Sort by total value of positions (most active first)
    trackedTraders.sort((a, b) => b.totalValue - a.totalValue);
    
    const response: CopyTradingResponse = {
      traders: trackedTraders,
      total: trackedTraders.length,
      lastUpdated: new Date().toISOString(),
    };
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Error in copy trading API route:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch copy trading data',
        details: error instanceof Error ? error.message : 'Unknown error',
        traders: [],
        total: 0,
        lastUpdated: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

