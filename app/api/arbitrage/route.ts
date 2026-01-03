import { NextResponse } from 'next/server';
import { fetchMarkets } from '@/lib/polymarket-api';
import { fetchKalshiMarkets, getKalshiPrice } from '@/lib/kalshi-api';
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
    const debug = searchParams.get('debug') === 'true';

    // Fetch markets from both platforms
    console.log('🔄 Starting arbitrage scan...');
    const [polyMarkets, kalshiData] = await Promise.all([
      fetchMarkets(limit),
      fetchKalshiMarkets(limit),
    ]);
    
    // Log for debugging
    console.log(`📊 Arbitrage check: ${polyMarkets.markets.length} Polymarket markets, ${kalshiData.markets.length} Kalshi markets`);
    
    // Log sample markets for debugging
    if (polyMarkets.markets.length > 0) {
      console.log(`📋 Sample Polymarket: "${polyMarkets.markets[0].question}" (${polyMarkets.markets[0].yesPrice}%)`);
    }
    if (kalshiData.markets.length > 0) {
      console.log(`📋 Sample Kalshi: "${kalshiData.markets[0].title}" (${getKalshiPrice(kalshiData.markets[0])}%)`);
    }

    // Find arbitrage opportunities
    console.log('🔍 Matching markets for arbitrage...');
    const allOpportunities = findArbitrageOpportunities(
      polyMarkets.markets,
      kalshiData.markets
    );
    console.log(`✅ Found ${allOpportunities.length} potential arbitrage opportunities`);

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

    // Include debug info in response if no opportunities found or debug=true
    const response: any = {
      opportunities: opportunities.slice(0, limit),
      stats,
    };

    // Add debug info if no opportunities or debug flag is set
    if (opportunities.length === 0 || debug) {
      const keyId = process.env.KALSHI_KEY_ID;
      const privateKey = process.env.KALSHI_PRIVATE_KEY;
      
      response.debug = {
        timestamp: new Date().toISOString(),
        credentials: {
          hasKeyId: !!keyId,
          hasPrivateKey: !!privateKey,
          keyIdLength: keyId?.length || 0,
        },
        markets: {
          polymarketCount: polyMarkets.markets.length,
          kalshiCount: kalshiData.markets.length,
          hasPolymarketMarkets: polyMarkets.markets.length > 0,
          hasKalshiMarkets: kalshiData.markets.length > 0,
        },
        kalshiError: kalshiData.error || null,
        opportunities: {
          found: opportunities.length,
          profitable: opportunities.filter(opp => opp.spread > 0).length,
        },
        samples: {
          polymarket: polyMarkets.markets.length > 0 ? {
            question: polyMarkets.markets[0].question,
            yesPrice: polyMarkets.markets[0].yesPrice,
            category: polyMarkets.markets[0].category,
          } : null,
          kalshi: kalshiData.markets.length > 0 ? {
            title: kalshiData.markets[0].title,
            price: getKalshiPrice(kalshiData.markets[0]),
            category: kalshiData.markets[0].category,
            event_ticker: kalshiData.markets[0].event_ticker,
          } : null,
        },
        analysis: {
          possibleIssues: [],
        },
      };

      // Add possible issues
      if (polyMarkets.markets.length === 0) {
        response.debug.analysis.possibleIssues.push('No Polymarket markets fetched');
      }
      if (kalshiData.markets.length === 0) {
        response.debug.analysis.possibleIssues.push('No Kalshi markets fetched - check API authentication or endpoint');
      }
      if (polyMarkets.markets.length > 0 && kalshiData.markets.length > 0 && opportunities.length === 0) {
        response.debug.analysis.possibleIssues.push('Markets fetched but no matches found - markets may not overlap or matching threshold too strict');
      }
      if (!keyId || !privateKey) {
        response.debug.analysis.possibleIssues.push('Kalshi credentials not set in environment variables');
      }
    }

    return NextResponse.json(response, {
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

