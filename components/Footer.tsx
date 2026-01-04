import Link from 'next/link';

const socialLinks = [
  { name: 'X (Twitter)', href: 'https://twitter.com/scope' },
  { name: 'GitHub', href: 'https://github.com/scope' },
  { name: 'GitBook', href: 'https://docs.scope.xyz' },
];

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#40424C] border-t border-gray-200 dark:border-[#4A4D58] py-12 transition-colors">
      <div className="section-container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Social Links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {socialLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 scope. real-time Polymarket deal tracking.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

