'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'home', href: '/' },
    { name: 'chat', href: '/chat' },
    { name: 'recommendations', href: '/recommendations' },
    { name: 'alerts', href: '/alerts' },
    { name: 'new accounts', href: '/new-accounts' },
    { name: 'whales', href: '/whales' },
    { name: 'copy trading', href: '/copy-trading' },
    { name: 'arbitrage', href: '/arbitrage' },
    { name: 'roadmap', href: '/roadmap' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
      <nav className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity">
            scope
          </Link>

          {/* Desktop Navigation - Compact single line */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-4xl mx-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-1.5 text-sm font-medium capitalize rounded-md transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side: X button (desktop) and Hamburger (mobile) */}
          <div className="flex items-center gap-3">
            {/* Follow on X Button - Desktop only */}
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="hidden lg:inline">x</span>
            </a>

            {/* Hamburger Menu Button - Right side */}
            <button
              className="lg:hidden text-gray-900 dark:text-white focus:outline-none p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Slides down from top */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-4 py-2 text-sm font-medium capitalize rounded-md transition-all ${
                  isActive(item.href)
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>follow on x</span>
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}

