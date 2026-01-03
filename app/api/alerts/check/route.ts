/**
 * API Route to check for new markets and send alerts
 * 
 * This should be called periodically (e.g., via Vercel Cron or external cron service)
 */

import { NextResponse } from 'next/server';
import { fetchMarkets } from '@/lib/polymarket-api';
import { findNewMarkets } from '@/lib/market-tracker';
import { sendAlertsForMarkets } from '@/lib/alert-service';

export async function GET(request: Request) {
  try {
    // Verify this is an authorized request (optional: add API key check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔍 Checking for new markets...');

    // Fetch current markets
    const marketsResponse = await fetchMarkets(500); // Check top 500 markets
    const markets = marketsResponse.markets;

    // Find new markets
    const newMarkets = await findNewMarkets(markets);

    console.log(`📊 Found ${newMarkets.length} new markets`);

    if (newMarkets.length === 0) {
      return NextResponse.json({
        success: true,
        newMarkets: 0,
        alertsSent: 0,
        message: 'No new markets found',
      });
    }

    // Send alerts for new markets
    const alertsSent = await sendAlertsForMarkets(newMarkets);

    return NextResponse.json({
      success: true,
      newMarkets: newMarkets.length,
      alertsSent,
      markets: newMarkets.map(m => ({
        id: m.id,
        question: m.question,
        category: m.category,
      })),
    });
  } catch (error) {
    console.error('Error checking for new markets:', error);
    return NextResponse.json(
      {
        error: 'Failed to check for new markets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

