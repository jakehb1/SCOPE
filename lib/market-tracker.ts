/**
 * Market Tracker
 * 
 * Tracks which markets have been seen to detect new ones
 */

import { Market } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';

const SEEN_MARKETS_FILE = path.join(process.cwd(), 'data', 'seen-markets.json');

interface SeenMarkets {
  marketIds: Set<string>;
  lastCheck: string;
}

let seenMarketsCache: SeenMarkets | null = null;

/**
 * Load seen markets from file
 */
async function loadSeenMarkets(): Promise<SeenMarkets> {
  if (seenMarketsCache) {
    return seenMarketsCache;
  }

  try {
    // Ensure data directory exists
    const dataDir = path.dirname(SEEN_MARKETS_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    const data = await fs.readFile(SEEN_MARKETS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    seenMarketsCache = {
      marketIds: new Set(parsed.marketIds || []),
      lastCheck: parsed.lastCheck || new Date().toISOString(),
    };
  } catch (error) {
    // File doesn't exist yet, create empty set
    seenMarketsCache = {
      marketIds: new Set<string>(),
      lastCheck: new Date().toISOString(),
    };
  }

  return seenMarketsCache!;
}

/**
 * Save seen markets to file
 */
async function saveSeenMarkets(data: SeenMarkets): Promise<void> {
  try {
    const dataDir = path.dirname(SEEN_MARKETS_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    await fs.writeFile(
      SEEN_MARKETS_FILE,
      JSON.stringify({
        marketIds: Array.from(data.marketIds),
        lastCheck: data.lastCheck,
      }, null, 2),
      'utf-8'
    );
    seenMarketsCache = data;
  } catch (error) {
    console.error('Error saving seen markets:', error);
  }
}

/**
 * Find new markets that haven't been seen before
 */
export async function findNewMarkets(markets: Market[]): Promise<Market[]> {
  const seen = await loadSeenMarkets();
  const newMarkets: Market[] = [];

  for (const market of markets) {
    if (!seen.marketIds.has(market.id)) {
      newMarkets.push(market);
      seen.marketIds.add(market.id);
    }
  }

  // Update last check time
  seen.lastCheck = new Date().toISOString();

  // Save updated seen markets
  if (newMarkets.length > 0) {
    await saveSeenMarkets(seen);
  }

  return newMarkets;
}

/**
 * Get all seen market IDs (for debugging)
 */
export async function getSeenMarketCount(): Promise<number> {
  const seen = await loadSeenMarkets();
  return seen.marketIds.size;
}

