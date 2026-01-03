'use client';

import ElevatedCard from '@/components/shared/ElevatedCard';
import DashboardContainer from '@/components/shared/DashboardContainer';

interface RoadmapItem {
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming' | 'future';
  quarter?: string;
  features: string[];
}

const roadmapItems: RoadmapItem[] = [
  {
    title: 'Foundation & Core Features',
    description: 'The essential features that make scope a powerful prediction markets intelligence platform',
    status: 'completed',
    features: [
      'Real-time market data from Polymarket',
      'AI-powered market context with web research',
      'Whale leaderboard tracking',
      'Arbitrage scanner (Polymarket vs Kalshi)',
      'SMS alerts for new markets',
      'Advanced filtering and search',
      'Market recommendations engine',
      'AI trading advisor chat',
    ],
  },
  {
    title: 'Mobile App Launch',
    description: 'Take scope on the go with native iOS and Android apps',
    status: 'in-progress',
    quarter: 'Q2 2025',
    features: [
      'Native iOS and Android apps',
      'Push notifications for market alerts',
      'Portfolio tracking on mobile',
      'Quick market actions (bet, sell)',
      'Offline mode for viewing saved markets',
      'Biometric authentication',
    ],
  },
  {
    title: 'Portfolio & Analytics',
    description: 'Track your positions and analyze your trading performance',
    status: 'in-progress',
    quarter: 'Q2 2025',
    features: [
      'Real-time portfolio tracking',
      'P&L analytics and charts',
      'Win rate and ROI metrics',
      'Position sizing calculator',
      'Trade history and export',
      'Performance benchmarking',
    ],
  },
  {
    title: 'SCOPE Token Launch',
    description: 'Introducing the SCOPE token - governance, staking, and premium access',
    status: 'upcoming',
    quarter: 'Q3 2025',
    features: [
      'Token launch on Polygon/Ethereum',
      'Governance voting for platform features',
      'Staking rewards for token holders',
      'Premium features unlocked with tokens',
      'Token-gated advanced analytics',
      'Revenue sharing for stakers',
      'Early access to new features',
    ],
  },
  {
    title: 'Advanced Trading Tools',
    description: 'Professional-grade tools for serious traders',
    status: 'upcoming',
    quarter: 'Q3 2025',
    features: [
      'Advanced charting with technical indicators',
      'Custom trading strategies builder',
      'Automated position management',
      'Risk management tools',
      'Backtesting engine',
      'Paper trading mode',
      'Trading signals and alerts',
    ],
  },
  {
    title: 'Social & Community',
    description: 'Connect with other traders and share insights',
    status: 'upcoming',
    quarter: 'Q3 2025',
    features: [
      'User profiles and trading stats',
      'Follow top traders',
      'Share market analysis',
      'Community discussions',
      'Copy trading features',
      'Leaderboard competitions',
      'Discord integration',
    ],
  },
  {
    title: 'API & Integrations',
    description: 'Build on top of scope with our developer platform',
    status: 'upcoming',
    quarter: 'Q4 2025',
    features: [
      'Public REST API',
      'WebSocket streams for real-time data',
      'Webhook support',
      'Trading bot integrations',
      'Zapier/Make.com connectors',
      'Custom dashboard builder',
      'API rate limits and pricing tiers',
    ],
  },
  {
    title: 'Premium Subscription',
    description: 'Unlock advanced features with SCOPE Premium',
    status: 'upcoming',
    quarter: 'Q4 2025',
    features: [
      'Unlimited API access',
      'Advanced AI insights',
      'Priority support',
      'Early market alerts',
      'Exclusive analytics',
      'Custom alert rules',
      'Historical data access',
    ],
  },
  {
    title: 'Multi-Platform Expansion',
    description: 'Expand beyond Polymarket to other prediction markets',
    status: 'future',
    quarter: '2026',
    features: [
      'Kalshi full integration',
      'Manifold Markets support',
      'Augur integration',
      'Cross-platform arbitrage',
      'Unified portfolio view',
      'Platform comparison tools',
    ],
  },
  {
    title: 'AI Trading Assistant',
    description: 'Advanced AI that learns your trading style and provides personalized insights',
    status: 'future',
    quarter: '2026',
    features: [
      'Personalized trading recommendations',
      'AI-powered risk assessment',
      'Automated trade execution',
      'Market sentiment analysis',
      'Predictive analytics',
      'Anomaly detection',
    ],
  },
  {
    title: 'Institutional Features',
    description: 'Enterprise-grade tools for professional traders and funds',
    status: 'future',
    quarter: '2026',
    features: [
      'Multi-account management',
      'Team collaboration tools',
      'Advanced reporting',
      'Compliance and audit logs',
      'White-label solutions',
      'Custom integrations',
    ],
  },
];

function getStatusColor(status: RoadmapItem['status']) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'upcoming':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'future':
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusIcon(status: RoadmapItem['status']) {
  switch (status) {
    case 'completed':
      return '✓';
    case 'in-progress':
      return '⟳';
    case 'upcoming':
      return '→';
    case 'future':
      return '○';
  }
}

export default function RoadmapView() {
  return (
    <DashboardContainer
      title="Product Roadmap"
      subtitle="What's coming next for scope"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Introduction */}
        <ElevatedCard className="p-6 mb-8">
          <p className="text-gray-700 leading-relaxed">
            We're building the most comprehensive prediction markets intelligence platform. 
            Here's what we've shipped, what's in progress, and what's coming next. 
            Have ideas? <a href="https://x.com" className="text-primary-black font-semibold hover:underline">Let us know on X</a>.
          </p>
        </ElevatedCard>

        {/* Roadmap Items */}
        {roadmapItems.map((item, index) => (
          <ElevatedCard key={index} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-primary-black">{item.title}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      item.status
                    )}`}
                  >
                    <span className="mr-1">{getStatusIcon(item.status)}</span>
                    {item.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                {item.quarter && (
                  <p className="text-sm text-gray-500 mb-2">Target: {item.quarter}</p>
                )}
                <p className="text-gray-700 mb-4">{item.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {item.features.map((feature, featureIndex) => (
                <div
                  key={featureIndex}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <span className="text-primary-grey mt-0.5">•</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </ElevatedCard>
        ))}

        {/* Token Launch Highlight */}
        <ElevatedCard className="p-8 bg-gradient-to-br from-primary-black to-gray-900 text-primary-offwhite border-2 border-primary-grey">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">🚀 SCOPE Token Launch</h2>
            <p className="text-lg mb-6 opacity-90">
              Coming Q3 2025 - Be part of the future of prediction markets intelligence
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-bold text-lg mb-1">Governance</div>
                <div className="opacity-80">Vote on platform features and direction</div>
              </div>
              <div>
                <div className="font-bold text-lg mb-1">Staking Rewards</div>
                <div className="opacity-80">Earn rewards for holding and staking SCOPE</div>
              </div>
              <div>
                <div className="font-bold text-lg mb-1">Premium Access</div>
                <div className="opacity-80">Unlock advanced features with tokens</div>
              </div>
            </div>
            <div className="mt-6">
              <a
                href="https://x.com"
                className="inline-block px-6 py-3 bg-primary-offwhite text-primary-black rounded-xl font-semibold hover:bg-opacity-90 transition-all"
              >
                Follow for Updates
              </a>
            </div>
          </div>
        </ElevatedCard>

        {/* Footer Note */}
        <ElevatedCard className="p-6 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            <strong>Note:</strong> Roadmap timelines are estimates and subject to change based on user feedback and market conditions. 
            We prioritize features that provide the most value to our community.
          </p>
        </ElevatedCard>
      </div>
    </DashboardContainer>
  );
}
