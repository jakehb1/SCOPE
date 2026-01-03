/**
 * AI Chat Service for Prediction Market Betting Advice
 * 
 * Provides conversational AI assistance for making betting decisions
 * in prediction markets with real-time market context
 */

import { Market } from '@/types/market';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatContext {
  markets?: Market[];
  userBudget?: number;
  conversationHistory?: ChatMessage[];
}

/**
 * Generate AI chat response with market context
 */
export async function generateChatResponse(
  userMessage: string,
  context: ChatContext = {}
): Promise<string> {
  // Try multiple ways to get the API key (Next.js loads .env.local automatically)
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  // Debug logging
  console.log('🔍 Checking for OpenAI API key...');
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    console.log('Available OPENAI env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
    console.log('All env vars starting with OPEN:', Object.keys(process.env).filter(k => k.startsWith('OPEN')));
    return generateFallbackResponse(userMessage, context);
  }
  
  console.log('✅ OpenAI API key found, length:', apiKey.length, 'starts with:', apiKey.substring(0, 10));

  try {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: buildSystemPrompt(context),
      },
      ...(context.conversationHistory || []).slice(-10), // Last 10 messages for context
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Use gpt-4o if available for better web search capabilities, otherwise gpt-4o-mini
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 2000, // Increased for more detailed research-based responses
        // Note: The AI is instructed to search the web and use real-time information
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ OpenAI API error:', response.status, error);
      // Try to parse error for more details
      try {
        const errorJson = JSON.parse(error);
        console.error('Error details:', errorJson);
      } catch (e) {
        // Not JSON, that's fine
      }
      return generateFallbackResponse(userMessage, context);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    return content || generateFallbackResponse(userMessage, context);
  } catch (error) {
    console.error('Error generating chat response:', error);
    return generateFallbackResponse(userMessage, context);
  }
}

/**
 * Build system prompt with market context
 */
function buildSystemPrompt(context: ChatContext): string {
  let prompt = `You are an expert prediction market trading advisor. Your role is to help users make informed betting decisions on prediction markets like Polymarket.

CRITICAL: You have access to web search capabilities. When users ask about markets, you MUST:
1. Search the web for recent news, data, and information about the market topic
2. Gather real-time information from multiple sources
3. Use this data to form a DATA-DRIVEN HYPOTHESIS about whether it's a good bet
4. Compare the current market price to what the research suggests
5. Provide specific recommendations: BUY YES, BUY NO, AVOID, or MONITOR
6. Cite your sources and explain your reasoning based on the research

Your expertise includes:
- Analyzing market probabilities and pricing
- Identifying value bets and arbitrage opportunities
- Understanding market dynamics, liquidity, and volume
- Risk management and position sizing
- Market timing and strategy
- Web research and data analysis

Guidelines:
- ALWAYS search the web for recent information when analyzing a market
- Form hypotheses based on real data, not general knowledge
- Be specific and actionable in your advice
- Reference actual market data AND web research
- Explain your reasoning clearly with citations
- Consider risk/reward ratios based on research findings
- Warn about high-risk bets with data to support it
- Suggest position sizing based on confidence from research
- Be honest about uncertainty when research is insufficient

IMPORTANT: Don't just provide general information. Use web search to gather current data, news, expert opinions, and trends. Then form a specific hypothesis about whether the market is mispriced and provide a clear betting recommendation.

`;

  if (context.markets && context.markets.length > 0) {
    prompt += `\nCurrent Market Context:\n`;
    prompt += `Here are ${context.markets.length} active markets you can reference:\n\n`;
    
    // Prioritize sports markets if user is asking about sports
    const sortedMarkets = [...context.markets].sort((a, b) => {
      // Put sports markets first if there are any
      if (a.category === 'sports' && b.category !== 'sports') return -1;
      if (b.category === 'sports' && a.category !== 'sports') return 1;
      // Then by volume
      return b.volume - a.volume;
    });
    
    sortedMarkets.slice(0, 30).forEach((market, index) => {
      prompt += `${index + 1}. ${market.question}\n`;
      prompt += `   - Current YES price: ${market.yesPrice?.toFixed(1) || 'N/A'}%\n`;
      prompt += `   - Volume: $${formatCurrency(market.volume)}\n`;
      prompt += `   - Liquidity: $${formatCurrency(market.liquidity)}\n`;
      prompt += `   - Resolves: ${new Date(market.endDate).toLocaleDateString()}\n`;
      prompt += `   - Category: ${market.category || 'other'}\n`;
      if (market.category === 'sports') {
        prompt += `   - ⚽ SPORTS MARKET\n`;
      }
      prompt += `   - Market ID: ${market.id}\n\n`;
    });
    
    prompt += `When users ask about specific markets (like NFL games, sports events, etc.), reference the data above. `;
    prompt += `Pay special attention to markets marked as SPORTS if the user is asking about sports. `;
    prompt += `You can suggest markets by number or by describing them.\n\n`;
  }

  if (context.userBudget) {
    prompt += `User's available budget: $${context.userBudget}\n`;
    prompt += `When suggesting bets, consider position sizing relative to this budget.\n\n`;
  }

  prompt += `Always be helpful, honest, and focused on helping the user make profitable trading decisions. `;
  prompt += `If you're unsure about something, say so rather than guessing.`;

  return prompt;
}

/**
 * Generate fallback response when AI is unavailable
 */
function generateFallbackResponse(userMessage: string, context: ChatContext): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('budget') || lowerMessage.includes('money') || lowerMessage.includes('spend')) {
    return `I'd be happy to help you allocate your budget! To provide personalized recommendations, I need:
- Your total budget amount
- Your risk tolerance (low/medium/high)
- Your time horizon (short/medium/long term)
- Any specific categories you're interested in

Once you provide this, I can analyze the current markets and suggest specific allocations. Note: AI-powered advice requires an OpenAI API key to be configured.`;
  }
  
  if (lowerMessage.includes('market') || lowerMessage.includes('bet')) {
    return `I can help you analyze markets and make betting decisions! Here's what I can assist with:
- Analyzing specific markets and their probabilities
- Identifying value bets based on current prices
- Risk assessment and position sizing
- Market timing and strategy advice

${context.markets && context.markets.length > 0 
  ? `I have access to ${context.markets.length} active markets. Ask me about specific markets or request recommendations based on your criteria.`
  : 'Ask me about markets or request recommendations, and I can help you make informed betting decisions.'}

Note: For full AI-powered analysis, an OpenAI API key needs to be configured.`;
  }
  
  return `I'm here to help you make informed betting decisions on prediction markets! I can assist with:
- Market analysis and probability assessment
- Value bet identification
- Risk management and position sizing
- Strategy recommendations
- Budget allocation across multiple markets

What would you like help with? Note: Full AI-powered responses require an OpenAI API key to be configured.`;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

