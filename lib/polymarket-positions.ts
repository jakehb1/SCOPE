/**
 * Polymarket Positions API Client
 * 
 * Fetches trader positions from Polymarket Data API
 * Based on: https://docs.polymarket.com/api-reference/core/get-positions
 */

import { TraderPosition, TrackedTrader } from '@/types/copy-trading';
import { LeaderboardEntry } from '@/types/leaderboard';

const DATA_API_BASE = 'https://data-api.polymarket.com/v1';

export interface PositionsResponse {
  positions: TraderPosition[];
  total: number;
  error?: string;
}

/**
 * Fetch positions for a specific trader
 * 
 * @param proxyWallet - The trader's wallet address
 * @returns Array of positions
 */
export async function fetchTraderPositions(proxyWallet: string): Promise<PositionsResponse> {
  try {
    // Polymarket Data API endpoint for positions
    // Docs: https://docs.polymarket.com/developers/misc-endpoints/data-api-get-positions
    // Format: /positions?user={proxyWallet}
    const positionsUrl = `${DATA_API_BASE}/positions?user=${proxyWallet}&sizeThreshold=1`;
    console.log(`🔍 Fetching positions for trader: ${proxyWallet.substring(0, 8)}...`);
    
    const response = await fetch(positionsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    console.log(`📡 Positions API response status: ${response.status} for ${proxyWallet.substring(0, 8)}...`);

    if (response.ok) {
      const data = await response.json();
      console.log(`📦 Positions API response structure:`, Array.isArray(data) ? `Array[${data.length}]` : Object.keys(data));
      if (Array.isArray(data) && data.length > 0) {
        console.log(`📦 Sample position:`, JSON.stringify(data[0]).substring(0, 500));
      }
      
      // Positions API returns an array of positions
      const rawPositions = Array.isArray(data) ? data : data.positions || data.data || [];
      console.log(`📊 Found ${rawPositions.length} positions for trader`);
      
      const positions: TraderPosition[] = rawPositions.map((item: any) => {
        // Polymarket API response structure:
        // size, avgPrice, curPrice, conditionId, title, slug, outcome, cashPnl, percentPnl, etc.
        const shares = parseFloat(item.size || item.shares || item.quantity || item.amount || '0') || 0;
        const avgPrice = parseFloat(item.avgPrice || item.averagePrice || '0') || 0;
        const currentPrice = parseFloat(item.curPrice || item.currentPrice || item.price || '0') || undefined;
        
        // Use API-provided P&L if available, otherwise calculate
        let pnl: number | undefined = item.cashPnl !== undefined ? parseFloat(item.cashPnl) : undefined;
        let pnlPercentage: number | undefined = item.percentPnl !== undefined ? parseFloat(item.percentPnl) : undefined;
        
        // Calculate P&L if not provided by API
        if (pnl === undefined && currentPrice && avgPrice && shares > 0) {
          // P&L calculation depends on outcome
          const outcome = (item.outcome || item.side || 'Yes').toUpperCase();
          // Prices are typically in cents (0-100) for percentages
          const avgPricePercent = avgPrice > 1 ? avgPrice : avgPrice * 100;
          const currentPricePercent = currentPrice > 1 ? currentPrice : currentPrice * 100;
          
          if (outcome === 'YES' || outcome === 'Yes') {
            // For YES positions: profit if current price > avg price
            pnl = (currentPricePercent - avgPricePercent) * shares / 100; // Convert to USD
            pnlPercentage = ((currentPricePercent - avgPricePercent) / avgPricePercent) * 100;
          } else {
            // For NO positions: profit if current price < avg price
            pnl = (avgPricePercent - currentPricePercent) * shares / 100; // Convert to USD
            pnlPercentage = ((avgPricePercent - currentPricePercent) / avgPricePercent) * 100;
          }
        }
        
        // Determine outcome (YES/NO)
        const outcomeStr = (item.outcome || item.side || 'Yes').toString();
        const outcome: 'YES' | 'NO' = outcomeStr.toUpperCase().includes('YES') || outcomeStr === 'Yes' ? 'YES' : 'NO';
        
        return {
          conditionId: item.conditionId || item.condition_id || item.marketId || '',
          marketQuestion: item.title || item.marketQuestion || item.question || item.market || 'Unknown Market',
          marketSlug: item.slug || item.marketSlug,
          outcome: outcome,
          shares: shares,
          avgPrice: avgPrice > 1 ? avgPrice : avgPrice * 100, // Convert to percentage if needed
          currentPrice: currentPrice ? (currentPrice > 1 ? currentPrice : currentPrice * 100) : undefined,
          pnl: pnl,
          pnlPercentage: pnlPercentage,
          lastUpdated: item.lastUpdated || item.updatedAt || item.timestamp || new Date().toISOString(),
        };
      }).filter((pos: TraderPosition) => {
        // Filter out invalid positions - only include positions with size > 0
        return pos.conditionId && pos.shares > 0 && pos.marketQuestion !== 'Unknown Market';
      });

      console.log(`✅ Processed ${positions.length} valid positions for trader`);
      return {
        positions,
        total: positions.length,
      };
    } else {
      const errorText = await response.text();
      console.log(`❌ Positions API returned ${response.status}: ${errorText.substring(0, 200)}`);
      return {
        positions: [],
        total: 0,
        error: `API error: ${response.status}`,
      };
    }
  } catch (error) {
    const errorMsg = `Error fetching positions for ${proxyWallet}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMsg);
    return {
      positions: [],
      total: 0,
      error: errorMsg,
    };
  }
}

/**
 * Fetch positions for multiple traders
 * 
 * @param traders - Array of trader wallet addresses or leaderboard entries
 * @returns Map of wallet address to positions
 */
export async function fetchMultipleTraderPositions(
  traders: string[] | LeaderboardEntry[]
): Promise<Map<string, TraderPosition[]>> {
  const positionsMap = new Map<string, TraderPosition[]>();
  
  // Extract wallet addresses if LeaderboardEntry objects
  const wallets = traders.map(t => typeof t === 'string' ? t : t.proxyWallet);
  
  // Fetch positions for all traders in parallel (with rate limiting consideration)
  const positionPromises = wallets.map(async (wallet) => {
    const result = await fetchTraderPositions(wallet);
    return { wallet, positions: result.positions };
  });
  
  const results = await Promise.all(positionPromises);
  
  results.forEach(({ wallet, positions }) => {
    positionsMap.set(wallet, positions);
  });
  
  return positionsMap;
}

/**
 * Build TrackedTrader objects from leaderboard entries and their positions
 */
export function buildTrackedTraders(
  leaderboardEntries: LeaderboardEntry[],
  positionsMap: Map<string, TraderPosition[]>
): TrackedTrader[] {
  return leaderboardEntries.map((entry) => {
    const positions = positionsMap.get(entry.proxyWallet) || [];
    const totalValue = positions.reduce((sum, pos) => {
      const value = pos.shares * (pos.currentPrice || pos.avgPrice);
      return sum + value;
    }, 0);
    
    return {
      proxyWallet: entry.proxyWallet,
      userName: entry.userName,
      profileImage: entry.profileImage,
      xUsername: entry.xUsername,
      verifiedBadge: entry.verifiedBadge,
      rank: entry.rank,
      vol: entry.vol,
      pnl: entry.pnl,
      positions: positions,
      totalPositions: positions.length,
      totalValue: totalValue,
      lastActivity: positions.length > 0 
        ? positions.reduce((latest, pos) => {
            const posTime = new Date(pos.lastUpdated).getTime();
            const latestTime = new Date(latest.lastUpdated).getTime();
            return posTime > latestTime ? pos : latest;
          }).lastUpdated
        : undefined,
    };
  });
}

