/**
 * AI Service for generating market context
 * 
 * This service uses OpenAI's API to generate contextual information about markets.
 * You can also use Anthropic Claude, or other AI providers by modifying this service.
 */

interface ResearchResult {
  title: string;
  snippet: string;
  url: string;
  relevance: 'high' | 'medium' | 'low';
}

interface AIContextRequest {
  question: string;
  category?: string;
  endDate?: string;
  description?: string;
  currentPrice?: number;
  webResearch?: ResearchResult[];
  searchQuery?: string; // Search query for web research
}

interface AIContextResponse {
  summary: string;
  keyDates: string[];
  keyFactors: string[];
  bettingHypothesis?: string;
  confidence?: 'high' | 'medium' | 'low';
  recommendation?: 'BUY YES' | 'BUY NO' | 'AVOID' | 'MONITOR';
  relatedLinks?: Array<{ title: string; url: string }>;
}

/**
 * Generate market context using AI
 */
export async function generateMarketContext(
  request: AIContextRequest
): Promise<AIContextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ OPENAI_API_KEY not set, returning fallback context');
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
    return generateFallbackContext(request);
  }
  
  console.log('✅ OpenAI API key found for market context, length:', apiKey.length);

  try {
    const prompt = buildPrompt(request);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // Use gpt-4o-mini for cost efficiency, or gpt-4o for better quality
        messages: [
          {
            role: 'system',
            content: `You are a financial markets analyst specializing in prediction markets. Your job is to:
1. Gather real-time information from the web about the market topic
2. Analyze current news, trends, and data
3. Form a DATA-DRIVEN HYPOTHESIS about whether the market is a good bet
4. Compare the current market price to what the research suggests
5. Provide a clear recommendation: BUY YES, BUY NO, AVOID, or MONITOR

You have access to web search capabilities. When analyzing a market, search for recent news, expert opinions, relevant data, and trends. Use this information to form your hypothesis. Be specific and cite sources when possible.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }, // Request JSON response
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return generateFallbackContext(request);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return generateFallbackContext(request);
    }

    // Parse JSON response
    const parsed = JSON.parse(content);
    
    return {
      summary: parsed.summary || generateSummary(request),
      keyDates: Array.isArray(parsed.keyDates) ? parsed.keyDates : [],
      keyFactors: Array.isArray(parsed.keyFactors) ? parsed.keyFactors : [],
      bettingHypothesis: parsed.bettingHypothesis,
      confidence: parsed.confidence,
      recommendation: parsed.recommendation,
      relatedLinks: Array.isArray(parsed.relatedLinks) ? parsed.relatedLinks : undefined,
    };
  } catch (error) {
    console.error('Error generating AI context:', error);
    return generateFallbackContext(request);
  }
}

/**
 * Build the prompt for the AI
 */
function buildPrompt(request: AIContextRequest): string {
  const { question, category, endDate, description, currentPrice, webResearch, searchQuery } = request;
  
  let prompt = `Analyze this prediction market and provide a DATA-DRIVEN HYPOTHESIS about whether it's a good bet:\n\n`;
  prompt += `Market Question: ${question}\n`;
  
  if (category) {
    prompt += `Category: ${category}\n`;
  }
  
  if (endDate) {
    const date = new Date(endDate);
    prompt += `Resolution Date: ${date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}\n`;
  }
  
  if (description) {
    prompt += `Description: ${description}\n`;
  }
  
  if (currentPrice !== undefined) {
    prompt += `Current Yes Price: ${currentPrice.toFixed(1)}%\n`;
    prompt += `This means the market currently prices a ${currentPrice.toFixed(1)}% probability of YES.\n`;
  }
  
  // Add web research instructions
  if (searchQuery) {
    prompt += `\n=== WEB RESEARCH REQUIRED ===\n`;
    prompt += `You MUST search the web for real-time information about this market.\n`;
    prompt += `Search query: "${searchQuery}"\n\n`;
    prompt += `Search for:\n`;
    prompt += `- Recent news articles about the topic\n`;
    prompt += `- Expert opinions and analysis\n`;
    prompt += `- Relevant data, statistics, and trends\n`;
    prompt += `- Current events that might affect the outcome\n`;
    prompt += `- Market sentiment and public opinion\n\n`;
    prompt += `CRITICAL: After searching, use the real-time information you find to form your hypothesis. `;
    prompt += `Analyze the data, news, and trends to determine if the current market price (${currentPrice?.toFixed(1) || 'N/A'}%) is accurate, too high, or too low. `;
    prompt += `Cite specific sources and data points from your search results.\n\n`;
  } else if (webResearch && webResearch.length > 0) {
    prompt += `\n=== RECENT WEB RESEARCH ===\n`;
    prompt += `I've gathered ${webResearch.length} recent information sources:\n\n`;
    
    webResearch.forEach((result, index) => {
      prompt += `${index + 1}. ${result.title}\n`;
      prompt += `   ${result.snippet}\n`;
      prompt += `   Source: ${result.url}\n`;
      prompt += `   Relevance: ${result.relevance}\n\n`;
    });
    
    prompt += `\nCRITICAL: Use this real-time web research to form your hypothesis. `;
    prompt += `Analyze the data, news, and trends to determine if the current market price (${currentPrice?.toFixed(1) || 'N/A'}%) is accurate, too high, or too low.\n\n`;
  } else {
    prompt += `\nIMPORTANT: You should search the web for recent information about this market topic. `;
    prompt += `Use web search to gather real-time data, news, and expert opinions before forming your hypothesis.\n\n`;
  }
  
  prompt += `\nPlease provide a JSON response with the following structure:\n`;
  prompt += `{\n`;
  prompt += `  "summary": "A 2-3 sentence summary explaining what this market is about and why it matters",\n`;
  prompt += `  "keyDates": ["List of important dates related to this market"],\n`;
  prompt += `  "keyFactors": ["List of 3-5 key factors that could influence the outcome, based on web research"],\n`;
  prompt += `  "bettingHypothesis": "A DATA-DRIVEN hypothesis about whether this is a good bet. You MUST search the web first, then: Compare the current price (${currentPrice?.toFixed(1) || 'N/A'}%) to what your research suggests. Is it too high or too low? Cite specific data, news, or trends you found. Be specific about what the research indicates.",\n`;
  prompt += `  "confidence": "high" | "medium" | "low" - Your confidence based on the quality and quantity of research data found,\n`;
  prompt += `  "recommendation": "BUY YES" | "BUY NO" | "AVOID" | "MONITOR" - Your betting recommendation based on research,\n`;
  prompt += `  "relatedLinks": [{"title": "Link title", "url": "https://..."}] - Include links to sources you found in your research\n`;
  prompt += `}\n\n`;
  prompt += `CRITICAL REQUIREMENTS:\n`;
  prompt += `1. You MUST search the web using the search query provided above\n`;
  prompt += `2. Gather at least 3-5 recent sources (news articles, expert opinions, data)\n`;
  prompt += `3. Your "bettingHypothesis" MUST be based on the real-time data you find\n`;
  prompt += `4. Compare the market price to what the research suggests\n`;
  prompt += `5. Cite specific sources and data points in your hypothesis\n`;
  prompt += `6. Be specific: "Based on [source], [data point] suggests the market is [overpriced/underpriced/fair] because..."\n`;
  prompt += `7. Don't just provide general information - form a specific, data-driven opinion\n`;
  
  return prompt;
}

/**
 * Generate fallback context when AI is unavailable
 */
function generateFallbackContext(request: AIContextRequest): AIContextResponse {
  const { question, category, endDate, currentPrice } = request;
  
  const summary = `This market asks: "${question}". `;
  const categoryContext = category ? `It's categorized as ${category}. ` : '';
  const priceContext = currentPrice !== undefined 
    ? `The current yes price is ${currentPrice.toFixed(1)}%, indicating ${currentPrice > 50 ? 'higher' : 'lower'} probability of the event occurring. `
    : '';
  const dateContext = endDate 
    ? `The market resolves on ${new Date(endDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}. `
    : '';
  
  return {
    summary: summary + categoryContext + priceContext + dateContext + 'AI context generation requires an API key to be configured.',
    keyDates: endDate ? [`Market resolves: ${new Date(endDate).toLocaleDateString()}`] : [],
    keyFactors: [
      'Monitor relevant news and events',
      'Track market sentiment and volume',
      'Consider historical patterns if applicable',
    ],
  };
}

/**
 * Generate a simple summary when AI parsing fails
 */
function generateSummary(request: AIContextRequest): string {
  const { question, endDate, currentPrice } = request;
  
  let summary = `This market asks whether "${question}" will occur.`;
  
  if (endDate) {
    summary += ` The market resolves on ${new Date(endDate).toLocaleDateString()}.`;
  }
  
  if (currentPrice !== undefined) {
    summary += ` Current market price suggests a ${currentPrice.toFixed(1)}% probability.`;
  }
  
  return summary;
}

