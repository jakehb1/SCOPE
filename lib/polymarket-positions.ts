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
    // Format: /positions?user={proxyWallet}
    const positionsUrl = `${DATA_API_BASE}/positions?user=${proxyWallet}`;
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
      console.log(`📦 Positions API response structure:`, Object.keys(data));
      
      // Positions API may return array or object with positions array
      const rawPositions = Array.isArray(data) ? data : data.positions || data.data || [];
      console.log(`📊 Found ${rawPositions.length} positions for trader`);
      
      const positions: TraderPosition[] = rawPositions.map((item: any) => {
        const shares = parseFloat(item.shares || item.quantity || item.amount || '0') || 0;
        const avgPrice = parseFloat(item.avgPrice || item.averagePrice || item.price || item.fillPrice || '0') || 0;
        const currentPrice = parseFloat(item.currentPrice || item.price || item.lastPrice || '0') || undefined;
        
        // Calculate P&L if we have current price
        let pnl: number | undefined;
        let pnlPercentage: number | undefined;
        if (currentPrice && avgPrice && shares > 0) {
          // P&L calculation depends on outcome
          const outcome = (item.outcome || item.side || 'YES').toUpperCase();
          if (outcome === 'YES') {
            // For YES positions: profit if current price > avg price
            pnl = (currentPrice - avgPrice) * shares;
            pnlPercentage = ((currentPrice - avgPrice) / avgPrice) * 100;
          } else {
            // For NO positions: profit if current price < avg price
            pnl = (avgPrice - currentPrice) * shares;
            pnlPercentage = ((avgPrice - currentPrice) / avgPrice) * 100;
          }
        }
        
        return {
          conditionId: item.conditionId || item.condition_id || item.marketId || '',
          marketQuestion: item.marketQuestion || item.question || item.market || 'Unknown Market',
          marketSlug: item.marketSlug || item.slug,
          outcome: (item.outcome || item.side || 'YES').toUpperCase() as 'YES' | 'NO',
          shares: shares,
          avgPrice: avgPrice > 1 ? avgPrice : avgPrice * 100, // Convert to percentage if needed
          currentPrice: currentPrice ? (currentPrice > 1 ? currentPrice : currentPrice * 100) : undefined,
          pnl: pnl,
          pnlPercentage: pnlPercentage,
          lastUpdated: item.lastUpdated || item.updatedAt || item.timestamp || new Date().toISOString(),
        };
      }).filter((pos: TraderPosition) => {
        // Filter out invalid positions
        return pos.conditionId && pos.shares > 0 && pos.marketQuestion !== 'Unknown Market';
      });

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

