import { Check, Star, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out Borg-Tools',
    features: [
      '5 CVs per month',
      'GitHub integration',
      'Neon Tech template',
      'PDF download',
      '24h share links',
      'Basic AI suggestions',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$5',
    period: 'month',
    description: 'For active job seekers and freelancers',
    features: [
      'Unlimited CVs',
      'All templates',
      'LinkedIn integration',
      'Advanced AI insights',
      'Priority generation',
      'API access',
      'Custom branding',
      'Analytics dashboard',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Team',
    price: '$10',
    period: 'user/month',
    description: 'For teams and organizations',
    features: [
      'Everything in Pro',
      'Team management',
      'Bulk generation',
      'White-label export',
      'SSO integration',
      'Priority support',
      'Custom templates',
      'Usage analytics',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function Pricing() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Simple <span className="text-gradient">Pricing</span>
          </h2>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>
        
        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative card ${plan.popular ? 'card-neon scale-105' : ''} transition-transform duration-300 hover:scale-105`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-black px-4 py-1 rounded-full flex items-center gap-1 text-sm font-semibold">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}
              
              {/* Plan header */}
              <div className="text-center mb-8">
                <h3 className="font-display text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-text-muted">/{plan.period}</span>
                </div>
                <p className="text-text-muted">{plan.description}</p>
              </div>
              
              {/* Features list */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* CTA button */}
              <button 
                className={`w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center gap-2`}
              >
                {plan.popular && <Zap className="w-4 h-4" />}
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
        
        {/* Enterprise CTA */}
        <div className="text-center mt-16 card max-w-2xl mx-auto">
          <h3 className="font-display text-xl font-semibold mb-2">Need something custom?</h3>
          <p className="text-text-muted mb-4">
            We offer enterprise solutions with custom integrations, dedicated support, and SLA guarantees.
          </p>
          <button className="btn-secondary">
            Contact Enterprise Sales
          </button>
        </div>
      </div>
    </section>
  );
}