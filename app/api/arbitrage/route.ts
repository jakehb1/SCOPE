import { NextResponse } from 'next/server';
import { fetchMarkets } from '@/lib/polymarket-api';
import { fetchKalshiMarkets } from '@/lib/kalshi-api';
import { findArbitrageOpportunities } from '@/lib/arbitrage-matcher';
import { ArbitrageStats } from '@/types/arbitrage';

/**
 * API Route to fetch arbitrage opportunities
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Fetch markets from both platforms
    const [polyMarkets, kalshiData] = await Promise.all([
      fetchMarkets(limit),
      fetchKalshiMarkets(limit),
    ]);
    
    // Log for debugging
    console.log(`📊 Arbitrage check: ${polyMarkets.markets.length} Polymarket markets, ${kalshiData.markets.length} Kalshi markets`);

    // Find arbitrage opportunities
    const allOpportunities = findArbitrageOpportunities(
      polyMarkets.markets,
      kalshiData.markets
    );

    // Filter by category if specified
    let opportunities = allOpportunities;
    if (category !== 'all') {
      opportunities = allOpportunities.filter(opp => {
        const oppCategory = opp.category.toLowerCase();
        const filterCategory = category.toLowerCase();
        
        // Handle special category mappings
        if (filterCategory === 'politics' && (oppCategory === 'politics' || oppCategory === 'geopolitics')) {
          return true;
        }
        if (filterCategory === 'crypto' && oppCategory === 'crypto') {
          return true;
        }
        if (['nfl', 'nba', 'nhl', 'mlb', 'cfb', 'cbb'].includes(filterCategory)) {
          return oppCategory === 'sports' || oppCategory === filterCategory;
        }
        return oppCategory === filterCategory;
      });
    }

    // Calculate stats
    const profitableOpportunities = opportunities.filter(opp => opp.spread > 0);
    const averageSpread = opportunities.length > 0
      ? opportunities.reduce((sum, opp) => sum + opp.spread, 0) / opportunities.length
      : 0;
    const bestSpread = opportunities.length > 0
      ? Math.max(...opportunities.map(opp => opp.spread))
      : 0;

    const stats: ArbitrageStats = {
      opportunitiesFound: opportunities.length,
      averageSpread: averageSpread,
      bestSpread: bestSpread,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      opportunities: opportunities.slice(0, limit),
      stats,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error in arbitrage API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch arbitrage opportunities', 
        details: error instanceof Error ? error.message : 'Unknown error',
        opportunities: [],
        stats: {
          opportunitiesFound: 0,
          averageSpread: 0,
          bestSpread: 0,
          lastUpdated: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

