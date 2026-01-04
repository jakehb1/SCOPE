'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { TrackedTrader } from '@/types/copy-trading';
import {
  calculateTraderConnections,
  buildGraphData,
  TraderConnection,
  GraphNode,
  GraphLink,
} from '@/lib/trader-similarity';
import ElevatedCard from '@/components/shared/ElevatedCard';

// Dynamically import react-force-graph to avoid SSR issues
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d'),
  { ssr: false }
);

interface TraderNetworkGraphProps {
  traders: TrackedTrader[];
}

export default function TraderNetworkGraph({ traders }: TraderNetworkGraphProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const fgRef = useRef<any>(null);

  // Calculate connections between traders
  const connections = useMemo(() => {
    if (traders.length < 2) return [];
    return calculateTraderConnections(traders, 0.1); // Minimum 10% similarity
  }, [traders]);

  // Build graph data
  const graphData = useMemo(() => {
    if (traders.length === 0) return { nodes: [], links: [] };
    return buildGraphData(traders, connections, 100); // Top 100 connections
  }, [traders, connections]);

  // Calculate node size based on volume (normalized)
  const maxVolume = useMemo(() => {
    return Math.max(...graphData.nodes.map(n => n.volume), 1);
  }, [graphData.nodes]);

  const getNodeSize = useCallback((node: GraphNode) => {
    // Scale node size based on volume (min 5, max 20)
    const normalizedVolume = node.volume / maxVolume;
    return 5 + normalizedVolume * 15;
  }, [maxVolume]);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getProfileUrl = (proxyWallet: string): string => {
    return `https://polymarket.com/profile/${proxyWallet}`;
  };

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode | any) => {
    const graphNode = node as GraphNode;
    setSelectedNode(graphNode);
    // Center on node if it has x/y coordinates (added by force graph)
    if (fgRef.current && (node as any).x !== undefined && (node as any).y !== undefined) {
      fgRef.current.centerAt((node as any).x, (node as any).y, 1000);
      fgRef.current.zoom(2, 1000);
    }
  }, []);

  // Handle node hover
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
  }, []);

  // Filter connections for selected node
  const nodeConnections = useMemo(() => {
    if (!selectedNode) return [];
    return connections
      .filter(c => c.trader1 === selectedNode.proxyWallet || c.trader2 === selectedNode.proxyWallet)
      .map(c => ({
        ...c,
        otherTrader: c.trader1 === selectedNode.proxyWallet ? c.trader2 : c.trader1,
        otherTraderName: traders.find(t => 
          t.proxyWallet === (c.trader1 === selectedNode.proxyWallet ? c.trader2 : c.trader1)
        )?.userName || (c.trader1 === selectedNode.proxyWallet ? c.trader2 : c.trader1).substring(0, 8) + '...',
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  }, [selectedNode, connections, traders]);

  if (traders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
        No traders available for network visualization.
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-12rem)] lg:h-[calc(100vh-16rem)]">
      {/* Left Sidebar - Top Connections */}
      <div className="lg:w-80 flex-shrink-0">
        <ElevatedCard className="p-4 md:p-6 h-full overflow-hidden flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Top {Math.min(100, connections.length)} Connections
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              Highest Jaccard similarity
              <span className="cursor-help" title="Jaccard similarity measures how similar two traders' positions are (intersection over union)">
                ?
              </span>
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2">
            {connections.slice(0, 100).map((connection, index) => {
              const trader1 = traders.find(t => t.proxyWallet === connection.trader1);
              const trader2 = traders.find(t => t.proxyWallet === connection.trader2);
              
              return (
                <div
                  key={`${connection.trader1}-${connection.trader2}`}
                  className="p-3 bg-gray-50 dark:bg-[#565862] rounded-lg hover:bg-gray-100 dark:hover:bg-[#6A6D72] transition-colors cursor-pointer"
                  onClick={() => {
                    const node = graphData.nodes.find(n => n.proxyWallet === connection.trader1);
                    if (node) handleNodeClick(node);
                  }}
                >
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    #{index + 1}
                  </div>
                  <div className="text-xs text-gray-900 dark:text-white break-all mb-1">
                    {trader1?.userName || connection.trader1.substring(0, 6) + '...'}
                    <span className="mx-1 text-gray-400">↔</span>
                    {trader2?.userName || connection.trader2.substring(0, 6) + '...'}
                  </div>
                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {(connection.similarity * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {connection.commonMarketsCount} common markets
                  </div>
                </div>
              );
            })}
          </div>
        </ElevatedCard>
      </div>

      {/* Center - Network Graph */}
      <div className="flex-1 relative min-h-[500px] lg:min-h-0">
        <ElevatedCard className="p-4 md:p-6 h-full overflow-hidden">
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-white dark:bg-[#40424C] p-3 rounded-lg shadow-lg">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                Polymarket Trader Network
              </h3>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>• Drag nodes to move</div>
                <div>• Scroll/pinch to zoom</div>
                <div>• Click nodes for details</div>
                <div>• Node size = trade volume</div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#565862]">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <div>{graphData.nodes.length} wallets</div>
                  <div>{graphData.links.length} connections</div>
                  <div>{connections.length} total connections</div>
                </div>
              </div>
            </div>
          </div>

          {graphData.nodes.length > 0 && (
            <ForceGraph2D
              ref={fgRef}
              graphData={graphData}
              nodeLabel={(node: any) => {
                const graphNode = node as GraphNode;
                return `
                  ${graphNode.userName || graphNode.label}
                  Volume: ${formatCurrency(graphNode.volume)}
                  P&L: ${formatCurrency(graphNode.pnl)}
                  Positions: ${graphNode.positions}
                `;
              }}
              nodeColor={(node: any) => {
                const graphNode = node as GraphNode;
                // Color nodes based on P&L (blue for profit, red for loss)
                return graphNode.pnl >= 0 ? '#3B82F6' : '#EF4444';
              }}
              nodeVal={(node: any) => getNodeSize(node as GraphNode)}
              linkColor={() => 'rgba(255, 255, 255, 0.3)'}
              linkWidth={(link: any) => {
                const graphLink = link as GraphLink;
                return graphLink.similarity * 3;
              }}
              onNodeClick={(node: any) => handleNodeClick(node as GraphNode)}
              onNodeHover={(node: any) => handleNodeHover(node ? (node as GraphNode) : null)}
              nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D) => {
                const graphNode = node as GraphNode;
                const label = graphNode.userName || graphNode.label;
                const fontSize = 10;
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = graphNode.id === selectedNode?.id || graphNode.id === hoveredNode?.id
                  ? '#FFFFFF' 
                  : 'rgba(255, 255, 255, 0.8)';
                const size = (node.__size as number) || 10;
                ctx.fillText(label, node.x, node.y + size + 5);
              }}
              cooldownTicks={100}
              onEngineStop={() => {
                if (fgRef.current) {
                  fgRef.current.zoomToFit(400, 20);
                }
              }}
              backgroundColor="#000000"
              width={undefined}
              height={undefined}
              enablePanInteraction={true}
              enableZoomInteraction={true}
              enableNodeDrag={true}
            />
          )}
        </ElevatedCard>
      </div>

      {/* Right Sidebar - Node Details */}
      {selectedNode && (
        <div className="lg:w-80 flex-shrink-0">
          <ElevatedCard className="p-4 md:p-6 h-full overflow-hidden flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {selectedNode.userName || selectedNode.label}
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Address</div>
                <div className="text-sm text-gray-900 dark:text-white break-all font-mono">
                  {selectedNode.proxyWallet}
                </div>
              </div>

              {selectedNode.rank && (
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Rank</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    #{selectedNode.rank}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Trade Volume</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(selectedNode.volume)}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">P&L</div>
                <div className={`text-lg font-bold ${selectedNode.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(selectedNode.pnl)}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Open Positions</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedNode.positions}
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <a
                href={getProfileUrl(selectedNode.proxyWallet)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-medium transition-colors"
              >
                View Profile →
              </a>
            </div>

            {nodeConnections.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#565862]">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Top Connections
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {nodeConnections.map((conn, index) => (
                    <div
                      key={conn.otherTrader}
                      className="p-2 bg-gray-50 dark:bg-[#565862] rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-[#6A6D72] transition-colors"
                      onClick={() => {
                        const node = graphData.nodes.find(n => n.proxyWallet === conn.otherTrader);
                        if (node) handleNodeClick(node);
                      }}
                    >
                      <div className="text-xs text-gray-900 dark:text-white break-all">
                        {conn.otherTraderName}
                      </div>
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {formatPercentage(conn.similarity)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {conn.commonMarketsCount} markets
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ElevatedCard>
        </div>
      )}
    </div>
  );
}

