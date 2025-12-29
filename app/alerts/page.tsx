import AlertsFeed from '@/components/alerts/AlertsFeed';

export const metadata = {
  title: 'New Market Alerts | scope',
  description: 'Real-time alerts for newly created Polymarket markets',
};

export default function AlertsPage() {
  return <AlertsFeed />;
}

