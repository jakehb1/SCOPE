import { NextResponse } from 'next/server';
import { generateChatResponse, ChatContext } from '@/lib/ai-chat';
import { fetchMarkets } from '@/lib/polymarket-api';

/**
 * API Route for AI chat about prediction markets
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      message,
      conversationHistory = [],
      includeMarkets = true,
      marketLimit = 50,
      userBudget,
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build context with market data if requested
    const context: ChatContext = {
      conversationHistory: conversationHistory,
      userBudget: userBudget,
    };

    if (includeMarkets) {
      // Fetch current markets for context
      const marketsResponse = await fetchMarkets(marketLimit);
      context.markets = marketsResponse.markets;
    }

    // Generate AI response
    console.log('📨 Chat request received:', { messageLength: message.length, hasMarkets: !!context.markets, userBudget });
    const response = await generateChatResponse(message, context);
    console.log('✅ Chat response generated, length:', response.length);

    return NextResponse.json({
      message: response,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate', // Don't cache chat responses
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate chat response', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

