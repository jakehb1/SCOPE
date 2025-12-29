'use client';

import { useState } from 'react';

export default function Hero() {
  const [copied, setCopied] = useState(false);
  const contractAddress = 'iATcGSt9DhJF9ZiJ6dmR153N7bW2G4J9dSSDxWSpump';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <section className="section-container py-16 md:py-24">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary-red mb-6">
          scope
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-primary-black mb-8 max-w-2xl mx-auto">
          track newly created Polymarket deals in real time. get needed data like end date, liquidity, volume, and links - all inside Telegram.
        </p>

        {/* Telegram Bot Button */}
        <div className="mb-8">
          <a
            href="https://t.me/scope_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            Telegram Open Telegram bot
          </a>
        </div>

        {/* Contract Address */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <span className="text-sm font-medium text-primary-black">CA:</span>
          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
            <code className="text-sm font-mono text-primary-black">{contractAddress}</code>
            <button
              onClick={copyToClipboard}
              className="text-primary-red hover:text-primary-black transition-colors duration-200"
              aria-label="Copy contract address"
            >
              {copied ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

