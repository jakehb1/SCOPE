const features = [
  {
    title: 'Markets Explorer',
    description: 'Browse and filter prediction markets with key metrics. Sort by volume, newest, or ending soon. Get instant AI-powered market context.',
    href: '/markets',
  },
  {
    title: 'New Market Alerts',
    description: 'Real-time notifications when new Polymarket markets are created. Get alerts within seconds via web dashboard or Telegram.',
    href: '/alerts',
  },
  {
    title: 'Whale Tracker',
    description: 'Track large trades and identify insider-like activity. Monitor whale volume, buy/sell ratios, and filter by trade size and category.',
    href: '/whales',
  },
  {
    title: 'Arbitrage Scanner',
    description: 'Find profitable mispricings between Polymarket and Kalshi. Calculate spreads after fees and spot arbitrage opportunities.',
    href: '/arbitrage',
  },
  {
    title: 'AI Market Context',
    description: 'Get instant understanding of what markets mean. AI-generated summaries with key dates, factors, and related information.',
  },
];

export default function Features() {
  return (
    <section id="features" className="section-container py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-black mb-12 text-center">
          why scope?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Content = (
              <div className="bg-white p-6 rounded-lg border-2 border-primary-black hover:border-primary-red transition-all duration-200 hover:shadow-lg h-full flex flex-col">
                <h3 className="text-xl font-bold text-primary-black mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-700 leading-relaxed flex-1">
                  {feature.description}
                </p>
                {feature.href && (
                  <a
                    href={feature.href}
                    className="mt-4 text-primary-red hover:text-primary-black font-medium inline-block"
                  >
                    Explore →
                  </a>
                )}
              </div>
            );

            return feature.href ? (
              <a key={index} href={feature.href} className="block">
                {Content}
              </a>
            ) : (
              <div key={index}>{Content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

