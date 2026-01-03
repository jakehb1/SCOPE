import { NextResponse } from 'next/server';
import { MarketContext } from '@/types';
import { generateMarketContext } from '@/lib/ai-service';
import { getCachedContext, setCachedContext } from '@/lib/market-context-cache';
import { fetchMarket } from '@/lib/polymarket-api';
import { researchMarket, formatResearchForPrompt } from '@/lib/web-research';

/**
 * API Route to fetch or generate market context using AI
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const marketId = id;

    // Check cache first
    const cached = getCachedContext(marketId);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    // Fetch market details to provide more context to AI
    const market = await fetchMarket(marketId);
    
    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    // Research the market using web search for real-time data
    const researchResults = await researchMarket(
      market.question,
      market.category,
      5
    );
    
    // Generate AI context with actual web research results
    const aiContext = await generateMarketContext({
      question: market.question,
      category: market.category,
      endDate: market.endDate,
      currentPrice: market.yesPrice,
      webResearch: researchResults, // Pass actual search results
    });

    // Build full context object
    const context: MarketContext = {
      marketId,
      summary: aiContext.summary,
      keyDates: aiContext.keyDates,
      keyFactors: aiContext.keyFactors,
      bettingHypothesis: aiContext.bettingHypothesis,
      confidence: aiContext.confidence,
      recommendation: aiContext.recommendation,
      relatedLinks: aiContext.relatedLinks,
      generatedAt: new Date().toISOString(),
    };

    // Cache the result
    setCachedContext(marketId, context);

    return NextResponse.json(context, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error in market context API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market context', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

