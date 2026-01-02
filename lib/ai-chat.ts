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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 1500,
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

Your expertise includes:
- Analyzing market probabilities and pricing
- Identifying value bets and arbitrage opportunities
- Understanding market dynamics, liquidity, and volume
- Risk management and position sizing
- Market timing and strategy

Guidelines:
- Be specific and actionable in your advice
- Reference actual market data when available
- Explain your reasoning clearly
- Consider risk/reward ratios
- Warn about high-risk bets
- Suggest position sizing based on confidence
- Be honest about uncertainty when you don't have enough information

`;

  if (context.markets && context.markets.length > 0) {
    prompt += `\nCurrent Market Context:\n`;
    prompt += `Here are ${context.markets.length} active markets you can reference:\n\n`;
    
    context.markets.slice(0, 20).forEach((market, index) => {
      prompt += `${index + 1}. ${market.question}\n`;
      prompt += `   - Current YES price: ${market.yesPrice?.toFixed(1) || 'N/A'}%\n`;
      prompt += `   - Volume: $${formatCurrency(market.volume)}\n`;
      prompt += `   - Liquidity: $${formatCurrency(market.liquidity)}\n`;
      prompt += `   - Resolves: ${new Date(market.endDate).toLocaleDateString()}\n`;
      prompt += `   - Category: ${market.category || 'other'}\n`;
      prompt += `   - Market ID: ${market.id}\n\n`;
    });
    
    prompt += `When users ask about specific markets, reference the data above. `;
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

