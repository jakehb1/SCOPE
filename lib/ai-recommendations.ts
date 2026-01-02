/**
 * AI Service for generating market recommendations
 * 
 * Analyzes markets and provides personalized recommendations based on:
 * - Budget
 * - Risk tolerance
 * - Time horizon
 * - Category preferences
 */

import { Market } from '@/types/market';

interface RecommendationRequest {
  budget: number;
  preferences?: string; // User's preferences, goals, etc.
  riskTolerance?: 'low' | 'medium' | 'high';
  timeHorizon?: 'short' | 'medium' | 'long';
  categories?: string[];
}

interface MarketRecommendation {
  market: Market;
  recommendation: string;
  reasoning: string;
  suggestedAllocation: number; // Suggested $ amount to invest
  confidence: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}

interface RecommendationResponse {
  recommendations: MarketRecommendation[];
  totalAllocated: number;
  reasoning: string;
}

/**
 * Generate market recommendations using AI
 */
export async function generateMarketRecommendations(
  markets: Market[],
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return generateFallbackRecommendations(markets, request);
  }

  try {
    const prompt = buildRecommendationPrompt(markets, request);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a prediction market trading advisor. Analyze markets and provide personalized recommendations based on budget, risk tolerance, and user preferences. Be specific, actionable, and explain your reasoning. Focus on markets with good risk/reward ratios and clear resolution criteria.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return generateFallbackRecommendations(markets, request);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return generateFallbackRecommendations(markets, request);
    }

    const parsed = JSON.parse(content);
    
    // Map AI recommendations back to actual market objects
    const recommendations: MarketRecommendation[] = [];
    let totalAllocated = 0;
    
    if (Array.isArray(parsed.recommendations)) {
      for (const rec of parsed.recommendations.slice(0, 10)) { // Limit to top 10
        const market = markets.find(m => 
          m.id === rec.marketId || 
          m.question === rec.marketQuestion ||
          m.conditionId === rec.marketId
        );
        
        if (market) {
          const allocation = Math.min(
            rec.suggestedAllocation || request.budget / parsed.recommendations.length,
            request.budget - totalAllocated
          );
          
          recommendations.push({
            market,
            recommendation: rec.recommendation || 'Consider this market',
            reasoning: rec.reasoning || 'Based on market analysis',
            suggestedAllocation: allocation,
            confidence: rec.confidence || 'medium',
            riskLevel: rec.riskLevel || 'medium',
          });
          
          totalAllocated += allocation;
        }
      }
    }
    
    return {
      recommendations,
      totalAllocated,
      reasoning: parsed.overallReasoning || 'Based on market analysis and your criteria',
    };
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    return generateFallbackRecommendations(markets, request);
  }
}

/**
 * Build the prompt for AI recommendations
 */
function buildRecommendationPrompt(markets: Market[], request: RecommendationRequest): string {
  const { budget, preferences, riskTolerance, timeHorizon, categories } = request;
  
  // Prepare market data for AI
  const marketData = markets.slice(0, 50).map(m => ({
    id: m.id,
    question: m.question,
    category: m.category,
    yesPrice: m.yesPrice,
    volume: m.volume,
    liquidity: m.liquidity,
    endDate: m.endDate,
  }));
  
  let prompt = `I have $${budget} to invest in prediction markets. Help me decide which markets to allocate my budget to.\n\n`;
  
  if (preferences) {
    prompt += `My preferences/goals: ${preferences}\n`;
  }
  
  if (riskTolerance) {
    prompt += `Risk tolerance: ${riskTolerance}\n`;
  }
  
  if (timeHorizon) {
    prompt += `Time horizon: ${timeHorizon}\n`;
  }
  
  if (categories && categories.length > 0) {
    prompt += `Preferred categories: ${categories.join(', ')}\n`;
  }
  
  prompt += `\nAvailable markets (showing top 50 by volume):\n`;
  prompt += JSON.stringify(marketData, null, 2);
  
  prompt += `\n\nPlease provide a JSON response with the following structure:\n`;
  prompt += `{\n`;
  prompt += `  "overallReasoning": "Brief explanation of your recommendation strategy",\n`;
  prompt += `  "recommendations": [\n`;
  prompt += `    {\n`;
  prompt += `      "marketId": "market condition ID",\n`;
  prompt += `      "marketQuestion": "market question",\n`;
  prompt += `      "recommendation": "Buy YES or NO",\n`;
  prompt += `      "reasoning": "Why this market is a good fit (2-3 sentences)",\n`;
  prompt += `      "suggestedAllocation": 100,\n`;
  prompt += `      "confidence": "low|medium|high",\n`;
  prompt += `      "riskLevel": "low|medium|high"\n`;
  prompt += `    }\n`;
  prompt += `  ]\n`;
  prompt += `}\n\n`;
  prompt += `Guidelines:\n`;
  prompt += `- Allocate the full $${budget} budget across recommended markets\n`;
  prompt += `- Prioritize markets with good liquidity and clear resolution criteria\n`;
  prompt += `- Consider risk/reward ratios based on current prices\n`;
  prompt += `- Diversify across different categories if possible\n`;
  prompt += `- Explain why each recommendation fits the user's criteria\n`;
  prompt += `- Be specific about allocation amounts\n`;
  
  return prompt;
}

/**
 * Generate fallback recommendations when AI is unavailable
 */
function generateFallbackRecommendations(
  markets: Market[],
  request: RecommendationRequest
): RecommendationResponse {
  const { budget } = request;
  
  // Simple heuristic-based recommendations
  // Sort by volume and liquidity, filter by criteria
  let filtered = [...markets];
  
  if (request.categories && request.categories.length > 0) {
    filtered = filtered.filter(m => 
      m.category && request.categories!.includes(m.category)
    );
  }
  
  // Filter by time horizon
  if (request.timeHorizon === 'short') {
    const oneWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
    filtered = filtered.filter(m => new Date(m.endDate).getTime() < oneWeek);
  } else if (request.timeHorizon === 'long') {
    const oneMonth = Date.now() + 30 * 24 * 60 * 60 * 1000;
    filtered = filtered.filter(m => new Date(m.endDate).getTime() > oneMonth);
  }
  
  // Sort by volume and liquidity
  filtered.sort((a, b) => {
    const scoreA = (a.volume || 0) + (a.liquidity || 0);
    const scoreB = (b.volume || 0) + (b.liquidity || 0);
    return scoreB - scoreA;
  });
  
  // Take top 5-10 markets
  const topMarkets = filtered.slice(0, Math.min(8, filtered.length));
  const allocationPerMarket = budget / topMarkets.length;
  
  const recommendations: MarketRecommendation[] = topMarkets.map(market => ({
    market,
    recommendation: market.yesPrice && market.yesPrice < 50 ? 'Buy YES' : 'Consider',
    reasoning: `High volume ($${formatCurrency(market.volume)}) and liquidity ($${formatCurrency(market.liquidity)}). Current price: ${market.yesPrice?.toFixed(1) || 'N/A'}%.`,
    suggestedAllocation: allocationPerMarket,
    confidence: 'medium',
    riskLevel: market.yesPrice && (market.yesPrice < 20 || market.yesPrice > 80) ? 'high' : 'medium',
  }));
  
  return {
    recommendations,
    totalAllocated: budget,
    reasoning: `Selected top ${topMarkets.length} markets by volume and liquidity. AI recommendations require an API key to be configured.`,
  };
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

