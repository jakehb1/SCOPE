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
      const marketsResponse = await fetchMarkets(marketLimit * 2); // Fetch more to filter better
      
      // Filter markets based on user's message to provide more relevant context
      const lowerMessage = message.toLowerCase();
      let relevantMarkets = marketsResponse.markets;
      
      // If user asks about specific topics, filter markets
      if (lowerMessage.includes('nfl') || lowerMessage.includes('football game') || lowerMessage.includes('nfl game')) {
        relevantMarkets = marketsResponse.markets.filter(m => 
          m.category === 'sports' && 
          (m.question.toLowerCase().includes('nfl') || 
           m.question.toLowerCase().includes('football') ||
           m.slug.toLowerCase().includes('nfl') ||
           m.slug.toLowerCase().includes('football'))
        );
      } else if (lowerMessage.includes('sports') || lowerMessage.includes('sport')) {
        relevantMarkets = marketsResponse.markets.filter(m => m.category === 'sports');
      } else if (lowerMessage.includes('nba') || lowerMessage.includes('basketball')) {
        relevantMarkets = marketsResponse.markets.filter(m => 
          m.category === 'sports' && 
          (m.question.toLowerCase().includes('nba') || m.question.toLowerCase().includes('basketball'))
        );
      } else if (lowerMessage.includes('crypto') || lowerMessage.includes('bitcoin') || lowerMessage.includes('ethereum')) {
        relevantMarkets = marketsResponse.markets.filter(m => m.category === 'crypto');
      } else if (lowerMessage.includes('politics') || lowerMessage.includes('election')) {
        relevantMarkets = marketsResponse.markets.filter(m => m.category === 'politics');
      }
      
      // If we filtered too much, include some general markets too
      if (relevantMarkets.length < 10) {
        relevantMarkets = [
          ...relevantMarkets,
          ...marketsResponse.markets.filter(m => !relevantMarkets.includes(m)).slice(0, 20)
        ];
      }
      
      context.markets = relevantMarkets.slice(0, marketLimit);
    }

    // Generate AI response with web search capability
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

