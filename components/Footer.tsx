import Link from 'next/link';

const socialLinks = [
  { name: 'X (Twitter)', href: 'https://twitter.com/scope' },
  { name: 'GitHub', href: 'https://github.com/scope' },
  { name: 'GitBook', href: 'https://docs.scope.xyz' },
];

export default function Footer() {
  return (
    <footer className="bg-primary-black text-primary-offwhite py-12">
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
                className="font-medium hover:text-primary-grey transition-colors duration-200"
              >
                {link.name}
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

