'use client';

import { useState, useEffect } from 'react';
import { AlertPreferences } from '@/types/alerts';
import { MarketCategory } from '@/types';
import ElevatedCard from '@/components/shared/ElevatedCard';
import ElevatedInput from '@/components/shared/ElevatedInput';
import ElevatedButton from '@/components/shared/ElevatedButton';
import PillButton from '@/components/shared/PillButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import DashboardContainer from '@/components/shared/DashboardContainer';

const CATEGORIES: MarketCategory[] = ['all', 'politics', 'sports', 'crypto', 'finance', 'tech', 'culture', 'geopolitics', 'other'];

export default function AlertsFeed() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [keywords, setKeywords] = useState('');
  const [minVolume, setMinVolume] = useState<string>('');
  const [minLiquidity, setMinLiquidity] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  // Check if user is already subscribed
  useEffect(() => {
    const checkSubscription = async () => {
      const storedPhone = localStorage.getItem('alertPhoneNumber');
      if (storedPhone) {
        setPhoneNumber(storedPhone);
        setCheckingSubscription(true);
        try {
          const response = await fetch(`/api/alerts/subscribe?phoneNumber=${encodeURIComponent(storedPhone)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.subscription) {
              setIsSubscribed(true);
              setEnabled(data.subscription.preferences.enabled);
              setSelectedCategories(data.subscription.preferences.categories || ['all']);
              setKeywords(data.subscription.preferences.keywords?.join(', ') || '');
              setMinVolume(data.subscription.preferences.minVolume?.toString() || '');
              setMinLiquidity(data.subscription.preferences.minLiquidity?.toString() || '');
            }
          }
        } catch (err) {
          console.error('Error checking subscription:', err);
        } finally {
          setCheckingSubscription(false);
        }
      }
    };

    checkSubscription();
  }, []);

  const handleCategoryToggle = (category: string) => {
    if (category === 'all') {
      setSelectedCategories(['all']);
    } else {
      setSelectedCategories(prev => {
        const filtered = prev.filter(c => c !== 'all');
        if (filtered.includes(category)) {
          return filtered.length > 0 ? filtered : ['all'];
        }
        return [...filtered, category];
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate phone number (basic validation)
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      if (cleanedPhone.length < 10) {
        throw new Error('Please enter a valid phone number');
      }

      const preferences: AlertPreferences = {
        phoneNumber: cleanedPhone,
        enabled,
        categories: selectedCategories.length === 0 ? ['all'] : selectedCategories,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k.length > 0),
        minVolume: minVolume ? parseFloat(minVolume) : undefined,
        minLiquidity: minLiquidity ? parseFloat(minLiquidity) : undefined,
      };

      const response = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: cleanedPhone,
          preferences,
          action: isSubscribed ? 'update' : 'create',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save subscription');
      }

      localStorage.setItem('alertPhoneNumber', cleanedPhone);
      setIsSubscribed(true);
      setSuccess('SMS alerts configured successfully! You will receive text messages when new markets match your criteria.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!confirm('Are you sure you want to unsubscribe from SMS alerts?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          action: 'delete',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }

      localStorage.removeItem('alertPhoneNumber');
      setIsSubscribed(false);
      setSuccess('Successfully unsubscribed from SMS alerts.');
      setPhoneNumber('');
      setSelectedCategories(['all']);
      setKeywords('');
      setMinVolume('');
      setMinLiquidity('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSubscription) {
    return (
      <DashboardContainer>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer
      title="SMS Market Alerts"
      subtitle="Get notified via text when new markets are created"
    >
      <div className="max-w-2xl mx-auto">
        <ElevatedCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-primary-black mb-2">
                Phone Number *
              </label>
              <ElevatedInput
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890 or 1234567890"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            {/* Enable/Disable */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 text-primary-black border-gray-300 rounded focus:ring-primary-black"
                disabled={loading}
              />
              <label htmlFor="enabled" className="text-sm font-medium text-primary-black">
                Enable SMS alerts
              </label>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-primary-black mb-2">
                Categories to Alert On
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <PillButton
                    key={cat}
                    label={cat}
                    onClick={() => handleCategoryToggle(cat)}
                    active={selectedCategories.includes(cat)}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-primary-black mb-2">
                Keywords (comma-separated)
              </label>
              <ElevatedInput
                id="keywords"
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., NFL, election, bitcoin"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Only alert on markets containing these keywords (optional)
              </p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="minVolume" className="block text-sm font-medium text-primary-black mb-2">
                  Minimum Volume ($)
                </label>
                <ElevatedInput
                  id="minVolume"
                  type="number"
                  value={minVolume}
                  onChange={(e) => setMinVolume(e.target.value)}
                  placeholder="e.g., 10000"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="minLiquidity" className="block text-sm font-medium text-primary-black mb-2">
                  Minimum Liquidity ($)
                </label>
                <ElevatedInput
                  id="minLiquidity"
                  type="number"
                  value={minLiquidity}
                  onChange={(e) => setMinLiquidity(e.target.value)}
                  placeholder="e.g., 50000"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
                {success}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <ElevatedButton
                type="submit"
                disabled={loading || !phoneNumber}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  isSubscribed ? 'Update Subscription' : 'Subscribe to Alerts'
                )}
              </ElevatedButton>
              {isSubscribed && (
                <ElevatedButton
                  type="button"
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  variant="outline"
                >
                  Unsubscribe
                </ElevatedButton>
              )}
            </div>
          </form>
        </ElevatedCard>

        {/* Info Section */}
        <ElevatedCard className="p-6 mt-6">
          <h3 className="text-lg font-bold text-primary-black mb-4">How It Works</h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>• We check for new markets every few minutes</li>
            <li>• You'll receive an SMS when a new market matches your criteria</li>
            <li>• Messages include the market question, category, price, and a direct link</li>
            <li>• You can update your preferences or unsubscribe at any time</li>
          </ul>
          <p className="text-xs text-gray-500 mt-4">
            Note: SMS alerts require Twilio to be configured. Standard messaging rates may apply.
          </p>
        </ElevatedCard>
      </div>
    </DashboardContainer>
  );
}
