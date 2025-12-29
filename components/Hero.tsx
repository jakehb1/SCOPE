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
    <section className="bg-primary-red py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            scope
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl mx-auto opacity-90">
            Give traders a real-time edge in prediction markets. Track new markets, whale trades, arbitrage opportunities, and get AI-powered market context.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://t.me/scope_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-primary-red px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all duration-200"
            >
              Telegram Bot
            </a>
            <a
              href="https://t.me/scope"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-80 transition-all duration-200"
            >
              Telegram Channel
            </a>
            <a
              href="https://twitter.com/scope"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-80 transition-all duration-200"
            >
              X (Twitter)
            </a>
            <a
              href="https://github.com/jakehb1/SCOPE"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-80 transition-all duration-200"
            >
              GitHub
            </a>
            <a
              href="https://docs.scope.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-80 transition-all duration-200"
            >
              GitBook
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

