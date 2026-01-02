import { NextResponse } from 'next/server';
import { fetchMarkets } from '@/lib/polymarket-api';
import { generateMarketRecommendations } from '@/lib/ai-recommendations';

/**
 * API Route to get AI-powered market recommendations
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      budget,
      preferences,
      riskTolerance,
      timeHorizon,
      categories,
      limit = 200, // Number of markets to analyze
    } = body;

    // Validate budget
    if (!budget || typeof budget !== 'number' || budget <= 0) {
      return NextResponse.json(
        { error: 'Valid budget is required' },
        { status: 400 }
      );
    }

    // Fetch markets to analyze
    const marketsResponse = await fetchMarkets(limit);
    const markets = marketsResponse.markets;

    if (markets.length === 0) {
      return NextResponse.json(
        { error: 'No markets available for analysis' },
        { status: 404 }
      );
    }

    // Generate AI recommendations
    const recommendations = await generateMarketRecommendations(markets, {
      budget,
      preferences,
      riskTolerance,
      timeHorizon,
      categories,
    });

    return NextResponse.json(recommendations, {
      headers: {
        'Cache-Control': 'no-store', // Don't cache recommendations (they're personalized)
      },
    });
  } catch (error) {
    console.error('Error in recommendations API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate recommendations', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

