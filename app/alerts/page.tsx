import LargeTradesTracker from '@/components/trades/LargeTradesTracker';

export const metadata = {
  title: 'Large Trades Tracker | scope',
  description: 'Live tracking of significant purchases on Polymarket',
};

export default function AlertsPage() {
  return <LargeTradesTracker />;
}

