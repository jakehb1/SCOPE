const features = [
  {
    icon: '⚡',
    title: 'fast alerts',
    description: 'get instant notifications the moment new Polymarket deals are created.',
  },
  {
    icon: '📊',
    title: 'key market data',
    description: 'view needed information including end dates, liquidity levels, trading volume, and market chart.',
  },
  {
    icon: '🔗',
    title: 'direct access',
    description: 'one-click links take you straight to the market on Polymarket.',
  },
  {
    icon: '💬',
    title: 'telegram native',
    description: 'all updates will be sent directly to your telegram. easy as it is.',
  },
  {
    icon: 'ℹ️',
    title: 'stay informed',
    description: 'track market activity and spot opportunities before everyone else.',
  },
  {
    icon: '✨',
    title: 'easy setup',
    description: 'start in seconds. just open the bot and you\'re ready to receive updates.',
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
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg border-2 border-primary-black hover:border-primary-red transition-all duration-200 hover:shadow-lg"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-primary-black mb-2 capitalize">
                {feature.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

