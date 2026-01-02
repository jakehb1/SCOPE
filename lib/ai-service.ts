/**
 * AI Service for generating market context
 * 
 * This service uses OpenAI's API to generate contextual information about markets.
 * You can also use Anthropic Claude, or other AI providers by modifying this service.
 */

interface AIContextRequest {
  question: string;
  category?: string;
  endDate?: string;
  description?: string;
  currentPrice?: number;
}

interface AIContextResponse {
  summary: string;
  keyDates: string[];
  keyFactors: string[];
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
    console.warn('OPENAI_API_KEY not set, returning fallback context');
    return generateFallbackContext(request);
  }

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
            content: 'You are a financial markets analyst specializing in prediction markets. Provide concise, factual, and actionable insights about prediction markets. Focus on key dates, important factors, and relevant context that would help traders make informed decisions.',
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
  const { question, category, endDate, description, currentPrice } = request;
  
  let prompt = `Analyze this prediction market and provide context:\n\n`;
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
  }
  
  prompt += `\nPlease provide a JSON response with the following structure:\n`;
  prompt += `{\n`;
  prompt += `  "summary": "A 2-3 sentence summary explaining what this market is about and why it matters",\n`;
  prompt += `  "keyDates": ["List of important dates related to this market (e.g., election dates, earnings reports, event dates)"],\n`;
  prompt += `  "keyFactors": ["List of 3-5 key factors that could influence the outcome (e.g., economic indicators, political events, market trends)"],\n`;
  prompt += `  "relatedLinks": [{"title": "Link title", "url": "https://..."}]\n`;
  prompt += `}\n\n`;
  prompt += `Be specific and factual. Focus on information that would help a trader understand the market better.`;
  
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

