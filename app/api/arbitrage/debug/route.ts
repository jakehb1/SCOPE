import { NextResponse } from 'next/server';
import { fetchMarkets } from '@/lib/polymarket-api';
import { fetchKalshiMarkets, getKalshiPrice } from '@/lib/kalshi-api';
import { findArbitrageOpportunities } from '@/lib/arbitrage-matcher';

/**
 * Debug endpoint to see what's happening with arbitrage
 * Visit: /api/arbitrage/debug
 */
export async function GET() {
  const debug: any = {
    timestamp: new Date().toISOString(),
    steps: [],
    errors: [],
    data: {},
  };

  try {
    // Step 1: Check credentials
    debug.steps.push('Checking Kalshi credentials...');
    const keyId = process.env.KALSHI_KEY_ID;
    const privateKey = process.env.KALSHI_PRIVATE_KEY;
    
    if (!keyId || !privateKey) {
      debug.errors.push('Kalshi credentials not set');
      debug.data.hasCredentials = false;
    } else {
      debug.data.hasCredentials = true;
      debug.data.keyIdLength = keyId.length;
      debug.data.privateKeyLength = privateKey.length;
    }

    // Step 2: Fetch Polymarket markets
    debug.steps.push('Fetching Polymarket markets...');
    const polyMarkets = await fetchMarkets(100);
    debug.data.polymarket = {
      count: polyMarkets.markets.length,
      sample: polyMarkets.markets.slice(0, 3).map(m => ({
        question: m.question,
        yesPrice: m.yesPrice,
        category: m.category,
      })),
    };

    // Step 3: Fetch Kalshi markets
    debug.steps.push('Fetching Kalshi markets...');
    const kalshiData = await fetchKalshiMarkets(100);
    debug.data.kalshi = {
      count: kalshiData.markets.length,
      sample: kalshiData.markets.slice(0, 3).map(m => ({
        title: m.title,
        price: getKalshiPrice(m),
        category: m.category,
        event_ticker: m.event_ticker,
      })),
    };

    // Step 4: Find opportunities
    debug.steps.push('Matching markets for arbitrage...');
    const opportunities = findArbitrageOpportunities(
      polyMarkets.markets,
      kalshiData.markets
    );
    debug.data.opportunities = {
      count: opportunities.length,
      sample: opportunities.slice(0, 5).map(opp => ({
        event: opp.event,
        polymarketPrice: opp.polymarketPrice,
        kalshiPrice: opp.kalshiPrice,
        spread: opp.spread,
        spreadPercentage: opp.spreadPercentage,
      })),
    };

    // Step 5: Analysis
    debug.analysis = {
      hasPolymarketMarkets: polyMarkets.markets.length > 0,
      hasKalshiMarkets: kalshiData.markets.length > 0,
      hasOpportunities: opportunities.length > 0,
      possibleIssues: [],
    };

    if (polyMarkets.markets.length === 0) {
      debug.analysis.possibleIssues.push('No Polymarket markets fetched');
    }
    if (kalshiData.markets.length === 0) {
      debug.analysis.possibleIssues.push('No Kalshi markets fetched - check API authentication or endpoint');
    }
    if (polyMarkets.markets.length > 0 && kalshiData.markets.length > 0 && opportunities.length === 0) {
      debug.analysis.possibleIssues.push('Markets fetched but no matches found - markets may not overlap or matching threshold too strict');
    }

    debug.steps.push('Debug complete');
    debug.success = true;

  } catch (error) {
    debug.errors.push(error instanceof Error ? error.message : 'Unknown error');
    debug.success = false;
    console.error('Debug endpoint error:', error);
  }

  return NextResponse.json(debug, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

