import { NextResponse } from 'next/server';
import { fetchLeaderboard } from '@/lib/polymarket-leaderboard';
import {
  LeaderboardCategory,
  LeaderboardTimePeriod,
  LeaderboardOrderBy,
} from '@/types/leaderboard';

/**
 * API Route to fetch leaderboard data
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') || 'OVERALL') as LeaderboardCategory;
    const timePeriod = (searchParams.get('timePeriod') || 'MONTH') as LeaderboardTimePeriod;
    const orderBy = (searchParams.get('orderBy') || 'PNL') as LeaderboardOrderBy;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const leaderboard = await fetchLeaderboard(category, timePeriod, orderBy, limit, offset);

    // Log for debugging (remove in production if needed)
    console.log(`📊 Leaderboard fetched: ${leaderboard.entries.length} entries for ${category}/${timePeriod}/${orderBy}`);

    return NextResponse.json(leaderboard, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error in leaderboard API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

