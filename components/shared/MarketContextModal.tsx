'use client';

import { useState, useEffect } from 'react';
import { Market, MarketContext } from '@/types';
import LoadingSpinner from './LoadingSpinner';

interface MarketContextModalProps {
  market: Market | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MarketContextModal({ market, isOpen, onClose }: MarketContextModalProps) {
  const [context, setContext] = useState<MarketContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && market) {
      fetchContext(market.id);
    } else {
      setContext(null);
      setError(null);
    }
  }, [isOpen, market]);

  const fetchContext = async (marketId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/markets/${marketId}/context`);
      if (!response.ok) {
        throw new Error('Failed to fetch context');
      }
      const data = await response.json();
      setContext(data);
    } catch (err) {
      console.error('Error fetching context:', err);
      setError('Failed to load market context. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !market) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-primary-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b-2 border-primary-black p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-primary-black">Market Context</h2>
          <button
            onClick={onClose}
            className="text-primary-black hover:text-primary-red transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-primary-black mb-4">{market.question}</h3>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-4 text-gray-600">Loading context...</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 py-4">{error}</div>
          )}

          {context && !loading && (
            <div className="space-y-6">
              {/* Summary */}
              {context.summary && (
                <div>
                  <h4 className="font-bold text-primary-black mb-2">Summary</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{context.summary}</p>
                </div>
              )}

              {/* Key Dates */}
              {context.keyDates && context.keyDates.length > 0 && (
                <div>
                  <h4 className="font-bold text-primary-black mb-2">Key Dates</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {context.keyDates.map((date, index) => (
                      <li key={index}>{date}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Factors */}
              {context.keyFactors && context.keyFactors.length > 0 && (
                <div>
                  <h4 className="font-bold text-primary-black mb-2">Key Factors</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {context.keyFactors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Betting Hypothesis */}
              {context.bettingHypothesis && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-bold text-primary-black mb-2">📊 Betting Hypothesis</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-2">{context.bettingHypothesis}</p>
                  {context.confidence && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-primary-grey">Confidence: </span>
                      <span className={`text-sm font-bold ${
                        context.confidence === 'high' ? 'text-green-600' :
                        context.confidence === 'medium' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {context.confidence.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {context.recommendation && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-primary-grey">Recommendation: </span>
                      <span className={`text-sm font-bold ${
                        context.recommendation === 'BUY YES' ? 'text-green-600' :
                        context.recommendation === 'BUY NO' ? 'text-red-600' :
                        context.recommendation === 'AVOID' ? 'text-yellow-600' :
                        'text-primary-grey'
                      }`}>
                        {context.recommendation}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Related Links */}
              {context.relatedLinks && context.relatedLinks.length > 0 && (
                <div>
                  <h4 className="font-bold text-primary-black mb-2">Related Links</h4>
                  <ul className="space-y-2">
                    {context.relatedLinks.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-grey hover:text-primary-black underline"
                        >
                          {link.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!context && !loading && !error && (
            <div className="text-gray-600 py-4">No context available for this market.</div>
          )}
        </div>
      </div>
    </div>
  );
}

