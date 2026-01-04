/**
 * Trader Similarity Calculator
 * 
 * Calculates Jaccard similarity between traders based on their positions
 */

import { TrackedTrader } from '@/types/copy-trading';

export interface TraderConnection {
  trader1: string;
  trader2: string;
  similarity: number; // Jaccard similarity (0-1)
  commonMarkets: string[];
  commonMarketsCount: number;
}

/**
 * Calculate Jaccard similarity between two traders based on their positions
 * Jaccard similarity = |A ∩ B| / |A ∪ B|
 * 
 * Where A and B are sets of condition IDs (markets) that traders have positions in
 */
export function calculateJaccardSimilarity(
  trader1: TrackedTrader,
  trader2: TrackedTrader
): number {
  const markets1 = new Set(trader1.positions.map(p => p.conditionId));
  const markets2 = new Set(trader2.positions.map(p => p.conditionId));

  // Intersection: markets both traders have positions in
  const intersection = new Set(
    [...markets1].filter(market => markets2.has(market))
  );

  // Union: all unique markets either trader has positions in
  const union = new Set([...markets1, ...markets2]);

  // Jaccard similarity = intersection / union
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Get common markets between two traders
 */
export function getCommonMarkets(
  trader1: TrackedTrader,
  trader2: TrackedTrader
): string[] {
  const markets1 = new Set(trader1.positions.map(p => p.conditionId));
  const markets2 = new Set(trader2.positions.map(p => p.conditionId));
  
  return [...markets1].filter(market => markets2.has(market));
}

/**
 * Calculate all connections between traders
 */
export function calculateTraderConnections(
  traders: TrackedTrader[],
  minSimilarity: number = 0.1 // Only show connections with at least 10% similarity
): TraderConnection[] {
  const connections: TraderConnection[] = [];

  for (let i = 0; i < traders.length; i++) {
    for (let j = i + 1; j < traders.length; j++) {
      const trader1 = traders[i];
      const trader2 = traders[j];

      // Skip if either trader has no positions
      if (trader1.positions.length === 0 || trader2.positions.length === 0) {
        continue;
      }

      const similarity = calculateJaccardSimilarity(trader1, trader2);

      if (similarity >= minSimilarity) {
        const commonMarkets = getCommonMarkets(trader1, trader2);
        
        connections.push({
          trader1: trader1.proxyWallet,
          trader2: trader2.proxyWallet,
          similarity,
          commonMarkets,
          commonMarketsCount: commonMarkets.length,
        });
      }
    }
  }

  // Sort by similarity (highest first)
  connections.sort((a, b) => b.similarity - a.similarity);

  return connections;
}

/**
 * Build graph data structure for network visualization
 */
export interface GraphNode {
  id: string;
  label: string;
  proxyWallet: string;
  userName: string | null;
  volume: number;
  pnl: number;
  positions: number;
  rank?: number;
  verifiedBadge?: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
  similarity: number;
  commonMarketsCount: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function buildGraphData(
  traders: TrackedTrader[],
  connections: TraderConnection[],
  topConnections: number = 100 // Limit to top N connections for performance
): GraphData {
  // Create nodes from traders
  const nodes: GraphNode[] = traders.map(trader => ({
    id: trader.proxyWallet,
    label: trader.userName || trader.proxyWallet.substring(0, 8) + '...',
    proxyWallet: trader.proxyWallet,
    userName: trader.userName,
    volume: trader.vol,
    pnl: trader.pnl,
    positions: trader.totalPositions,
    rank: trader.rank,
    verifiedBadge: trader.verifiedBadge,
  }));

  // Create links from connections (limit to top N for performance)
  const topConnectionsList = connections.slice(0, topConnections);
  const links: GraphLink[] = topConnectionsList.map(connection => ({
    source: connection.trader1,
    target: connection.trader2,
    similarity: connection.similarity,
    commonMarketsCount: connection.commonMarketsCount,
  }));

  return { nodes, links };
}

