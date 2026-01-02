'use client';

import { useState } from 'react';
import { Market } from '@/types/market';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MarketCard from '@/components/shared/MarketCard';

interface MarketRecommendation {
  market: Market;
  recommendation: string;
  reasoning: string;
  suggestedAllocation: number;
  confidence: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}

interface RecommendationResponse {
  recommendations: MarketRecommendation[];
  totalAllocated: number;
  reasoning: string;
}

export default function MarketRecommendations() {
  const [budget, setBudget] = useState<string>('500');
  const [preferences, setPreferences] = useState<string>('');
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');
  const [timeHorizon, setTimeHorizon] = useState<'short' | 'medium' | 'long'>('medium');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: 'politics', label: 'Politics' },
    { value: 'sports', label: 'Sports' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'finance', label: 'Finance' },
    { value: 'tech', label: 'Tech' },
    { value: 'culture', label: 'Culture' },
    { value: 'geopolitics', label: 'Geopolitics' },
  ];

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budget: parseFloat(budget),
          preferences: preferences.trim() || undefined,
          riskTolerance: riskTolerance,
          timeHorizon: timeHorizon,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get recommendations');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="section-container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">AI Market Recommendations</h1>
        <p className="text-white opacity-90">Get personalized market recommendations based on your budget and preferences</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Budget */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-primary-black mb-2">
              Budget ($)
            </label>
            <input
              type="number"
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min="1"
              step="0.01"
              required
              className="w-full px-4 py-2 border-2 border-primary-black rounded-lg focus:outline-none focus:border-primary-red text-primary-black"
              placeholder="500"
            />
          </div>

          {/* Preferences */}
          <div>
            <label htmlFor="preferences" className="block text-sm font-medium text-primary-black mb-2">
              Preferences / Goals (optional)
            </label>
            <textarea
              id="preferences"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border-2 border-primary-black rounded-lg focus:outline-none focus:border-primary-red text-primary-black"
              placeholder="e.g., I want to focus on high-probability markets, or I'm looking for value plays..."
            />
          </div>

          {/* Risk Tolerance */}
          <div>
            <label className="block text-sm font-medium text-primary-black mb-2">
              Risk Tolerance
            </label>
            <div className="flex gap-3">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setRiskTolerance(level)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    riskTolerance === level
                      ? 'bg-primary-red text-white'
                      : 'bg-gray-200 text-primary-black hover:bg-gray-300'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Time Horizon */}
          <div>
            <label className="block text-sm font-medium text-primary-black mb-2">
              Time Horizon
            </label>
            <div className="flex gap-3">
              {(['short', 'medium', 'long'] as const).map((horizon) => (
                <button
                  key={horizon}
                  type="button"
                  onClick={() => setTimeHorizon(horizon)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    timeHorizon === horizon
                      ? 'bg-primary-red text-white'
                      : 'bg-gray-200 text-primary-black hover:bg-gray-300'
                  }`}
                >
                  {horizon.charAt(0).toUpperCase() + horizon.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-primary-black mb-2">
              Preferred Categories (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategoryToggle(cat.value)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    selectedCategories.includes(cat.value)
                      ? 'bg-primary-red text-white'
                      : 'bg-gray-200 text-primary-black hover:bg-gray-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Analyzing markets...</span>
              </>
            ) : (
              'Get Recommendations'
            )}
          </button>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Overall Reasoning */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold text-primary-black mb-4">Recommendation Strategy</h2>
            <p className="text-gray-700 leading-relaxed">{results.reasoning}</p>
            <div className="mt-4 text-sm text-gray-600">
              Total allocated: <span className="font-bold text-primary-black">{formatCurrency(results.totalAllocated)}</span> of {formatCurrency(parseFloat(budget))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Recommended Markets ({results.recommendations.length})
            </h2>
            <div className="space-y-4">
              {results.recommendations.map((rec, index) => (
                <div key={rec.market.id} className="bg-white rounded-lg p-6 border-2 border-primary-black">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-primary-red text-white px-3 py-1 rounded-full font-bold text-sm">
                          #{index + 1}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          rec.recommendation.includes('YES') 
                            ? 'bg-green-100 text-green-800'
                            : rec.recommendation.includes('NO')
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rec.recommendation}
                        </span>
                        <span className={`text-sm font-medium ${getConfidenceColor(rec.confidence)}`}>
                          Confidence: {rec.confidence}
                        </span>
                        <span className={`text-sm font-medium ${getRiskColor(rec.riskLevel)}`}>
                          Risk: {rec.riskLevel}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-primary-black mb-2">
                        {rec.market.question}
                      </h3>
                      <p className="text-gray-700 mb-3">{rec.reasoning}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-2xl font-bold text-primary-red mb-1">
                        {formatCurrency(rec.suggestedAllocation)}
                      </div>
                      <div className="text-sm text-gray-600">Allocation</div>
                    </div>
                  </div>
                  
                  {/* Market Details */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-sm text-gray-600">Current Price</div>
                      <div className="text-lg font-bold text-primary-black">
                        {rec.market.yesPrice?.toFixed(1) || 'N/A'}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Volume</div>
                      <div className="text-lg font-bold text-primary-black">
                        {formatCurrency(rec.market.volume)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Liquidity</div>
                      <div className="text-lg font-bold text-primary-black">
                        {formatCurrency(rec.market.liquidity)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Market Card Link */}
                  <div className="mt-4">
                    <a
                      href={rec.market.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-primary-red text-white px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all"
                    >
                      View Market on Polymarket →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

