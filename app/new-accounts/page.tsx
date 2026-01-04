import NewAccountsTracker from '@/components/new-accounts/NewAccountsTracker';

export const metadata = {
  title: 'New Accounts Tracker | scope',
  description: 'Track recently created accounts making large trades on Polymarket',
};

export default function NewAccountsPage() {
  return <NewAccountsTracker />;
}

