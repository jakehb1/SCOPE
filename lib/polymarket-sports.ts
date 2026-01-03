/**
 * Polymarket Sports API Client
 * 
 * Fetches sports metadata from Polymarket Gamma API
 * Reference: https://docs.polymarket.com/api-reference/sports/get-sports-metadata-information
 */

export interface SportsMetadata {
  id: number;
  sport: string; // Sport identifier (e.g., "nfl", "nba", "ncaab")
  image: string;
  resolution: string;
  ordering: string;
  tags: string; // Comma-separated tag IDs
  series: string;
  createdAt: string;
}

let sportsMetadataCache: SportsMetadata[] | null = null;
let sportsMetadataCacheTime: number = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Fetch sports metadata from Polymarket API
 * Caches results for 1 hour
 */
export async function fetchSportsMetadata(): Promise<SportsMetadata[]> {
  // Return cached data if still valid
  const now = Date.now();
  if (sportsMetadataCache && (now - sportsMetadataCacheTime) < CACHE_DURATION) {
    return sportsMetadataCache;
  }

  try {
    const response = await fetch('https://gamma-api.polymarket.com/sports', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Sports API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      sportsMetadataCache = data;
      sportsMetadataCacheTime = now;
      return data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching sports metadata:', error);
    // Return cached data even if expired, or empty array
    return sportsMetadataCache || [];
  }
}

/**
 * Get all sport identifiers (e.g., ["nfl", "nba", "nhl", ...])
 */
export async function getSportIdentifiers(): Promise<string[]> {
  const metadata = await fetchSportsMetadata();
  return metadata.map(s => s.sport.toLowerCase());
}

/**
 * Get all tag IDs associated with sports
 */
export async function getSportsTagIds(): Promise<Set<string>> {
  const metadata = await fetchSportsMetadata();
  const tagIds = new Set<string>();
  
  metadata.forEach(sport => {
    if (sport.tags) {
      const tags = sport.tags.split(',').map(t => t.trim());
      tags.forEach(tag => {
        if (tag) tagIds.add(tag);
      });
    }
  });
  
  return tagIds;
}

/**
 * Check if a market is a sports market based on tags
 */
export async function isSportsMarketByTags(marketTags: (string | number)[]): Promise<boolean> {
  const sportsTagIds = await getSportsTagIds();
  
  return marketTags.some(tag => {
    const tagStr = String(tag);
    return sportsTagIds.has(tagStr);
  });
}

/**
 * Get sport identifier for a market if it's a sports market
 */
export async function getMarketSport(marketTags: (string | number)[]): Promise<string | null> {
  const metadata = await fetchSportsMetadata();
  
  for (const sport of metadata) {
    if (!sport.tags) continue;
    
    const sportTagIds = sport.tags.split(',').map(t => t.trim());
    const hasSportTag = marketTags.some(tag => {
      const tagStr = String(tag);
      return sportTagIds.includes(tagStr);
    });
    
    if (hasSportTag) {
      return sport.sport.toLowerCase();
    }
  }
  
  return null;
}

