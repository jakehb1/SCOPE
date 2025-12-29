import Link from 'next/link';

const socialLinks = [
  { name: 'Telegram Bot', href: 'https://t.me/scope_bot', icon: '🤖' },
  { name: 'Telegram Channel', href: 'https://t.me/scope', icon: '📢' },
  { name: 'X (Twitter)', href: 'https://twitter.com/scope', icon: '𝕏' },
  { name: 'GitHub', href: 'https://github.com/scope', icon: '💻' },
  { name: 'GitBook', href: 'https://docs.scope.xyz', icon: '📚' },
];

export default function Footer() {
  return (
    <footer className="bg-primary-black text-white py-12">
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
                className="flex items-center gap-2 hover:text-primary-red transition-colors duration-200"
              >
                <span className="text-xl">{link.icon}</span>
                <span className="font-medium">{link.name}</span>
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm text-gray-400">
              © 2025 scope. real-time Polymarket deal tracking.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

