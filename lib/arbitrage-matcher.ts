/**
 * Arbitrage Matching Logic
 * 
 * Matches markets from Polymarket and Kalshi to find arbitrage opportunities
 */

import { Market } from '@/types/market';
import { KalshiMarket, getKalshiPrice } from './kalshi-api';
import { ArbitrageOpportunity } from '@/types/arbitrage';

// Fee assumptions (as percentages)
export const POLYMARKET_FEE = 0.02; // 2% fee on Polymarket
export const KALSHI_FEE = 0.10; // 10% fee on Kalshi (estimated)

/**
 * Calculate similarity between two market questions/titles
 * Uses simple keyword matching and Levenshtein-like scoring
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  // Count matching words
  let matches = 0;
  const totalWords = Math.max(words1.length, words2.length);
  
  for (const word of words1) {
    if (words2.includes(word) && word.length > 2) { // Ignore short words
      matches++;
    }
  }
  
  // Also check for substring matches
  const longer = text1.length > text2.length ? text1 : text2;
  const shorter = text1.length > text2.length ? text2 : text1;
  
  if (longer.includes(shorter) || shorter.includes(longer)) {
    return Math.max(matches / totalWords, 0.7);
  }
  
  return matches / totalWords;
}

/**
 * Extract key terms from market question for matching
 */
function extractKeyTerms(text: string): string[] {
  const lower = text.toLowerCase();
  const stopWords = new Set(['will', 'the', 'be', 'a', 'an', 'by', 'on', 'in', 'at', 'to', 'for', 'of', 'and', 'or', 'but']);
  
  return lower
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 5); // Take top 5 key terms
}

/**
 * Check if two markets are likely the same event
 */
function isSameEvent(polyMarket: Market, kalshiMarket: KalshiMarket, threshold: number = 0.3): boolean {
  const polyText = polyMarket.question.toLowerCase();
  const kalshiText = (kalshiMarket.title + ' ' + (kalshiMarket.subtitle || '')).toLowerCase();
  
  // Calculate similarity
  const similarity = calculateSimilarity(polyText, kalshiText);
  
  // Also check key terms
  const polyTerms = extractKeyTerms(polyText);
  const kalshiTerms = extractKeyTerms(kalshiText);
  const termMatches = polyTerms.filter(term => kalshiTerms.some(kTerm => kTerm.includes(term) || term.includes(kTerm))).length;
  const termSimilarity = termMatches / Math.max(polyTerms.length, kalshiTerms.length, 1);
  
  // Combined similarity score
  const combinedSimilarity = (similarity * 0.7 + termSimilarity * 0.3);
  
  return combinedSimilarity >= threshold;
}

/**
 * Calculate arbitrage spread after fees
 * 
 * @param polyPrice - Polymarket YES price (0-100)
 * @param kalshiPrice - Kalshi YES price (0-100)
 * @returns Spread percentage after accounting for fees
 */
export function calculateSpread(polyPrice: number, kalshiPrice: number): {
  spread: number;
  spreadPercentage: number;
  profitable: boolean;
} {
  // Calculate spread before fees
  const rawSpread = kalshiPrice - polyPrice;
  
  // Account for fees
  // If buying on Polymarket and selling on Kalshi:
  // Cost: polyPrice * (1 + POLYMARKET_FEE)
  // Revenue: kalshiPrice * (1 - KALSHI_FEE)
  // Net: kalshiPrice * (1 - KALSHI_FEE) - polyPrice * (1 + POLYMARKET_FEE)
  
  const costWithFees = polyPrice * (1 + POLYMARKET_FEE);
  const revenueAfterFees = kalshiPrice * (1 - KALSHI_FEE);
  const netSpread = revenueAfterFees - costWithFees;
  
  // Also calculate reverse (buy on Kalshi, sell on Polymarket)
  const reverseCost = kalshiPrice * (1 + KALSHI_FEE);
  const reverseRevenue = polyPrice * (1 - POLYMARKET_FEE);
  const reverseSpread = reverseRevenue - reverseCost;
  
  // Use the better opportunity
  const bestSpread = Math.max(netSpread, reverseSpread);
  const bestDirection = netSpread > reverseSpread ? 'poly-to-kalshi' : 'kalshi-to-poly';
  
  return {
    spread: bestSpread,
    spreadPercentage: (bestSpread / Math.max(polyPrice, kalshiPrice, 1)) * 100,
    profitable: bestSpread > 0,
  };
}

/**
 * Match Polymarket and Kalshi markets to find arbitrage opportunities
 */
export function findArbitrageOpportunities(
  polyMarkets: Market[],
  kalshiMarkets: KalshiMarket[]
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];
  
  for (const polyMarket of polyMarkets) {
    // Skip if no price data
    if (!polyMarket.yesPrice || polyMarket.yesPrice <= 0) continue;
    
    // Find matching Kalshi market
    for (const kalshiMarket of kalshiMarkets) {
      if (isSameEvent(polyMarket, kalshiMarket)) {
        const kalshiPrice = getKalshiPrice(kalshiMarket);
        
        // Skip if no valid price
        if (kalshiPrice <= 0) continue;
        
        // Calculate spread
        const { spread, spreadPercentage, profitable } = calculateSpread(
          polyMarket.yesPrice,
          kalshiPrice
        );
        
        // Only include opportunities with meaningful spreads (> 0.5% after fees)
        // Lower threshold to catch more opportunities
        if (Math.abs(spreadPercentage) > 0.5) {
          opportunities.push({
            id: `${polyMarket.id}-${kalshiMarket.event_ticker}`,
            event: polyMarket.question,
            polymarketUrl: polyMarket.url,
            kalshiUrl: kalshiMarket.url || `https://kalshi.com/markets/${kalshiMarket.event_ticker}`,
            polymarketPrice: polyMarket.yesPrice,
            kalshiPrice: kalshiPrice,
            spread: spread,
            spreadPercentage: spreadPercentage,
            category: polyMarket.category || 'other',
            lastUpdated: new Date().toISOString(),
          });
        }
      }
    }
  }
  
  // Sort by spread (best opportunities first)
  opportunities.sort((a, b) => b.spread - a.spread);
  
  return opportunities;
}

