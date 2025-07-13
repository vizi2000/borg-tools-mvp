import { Bot, Palette, Shield, Zap, Github, FileText } from 'lucide-react';

const features = [
  {
    icon: Github,
    title: 'GitHub Native',
    description: 'One-click authentication with automatic data sync from your repositories, commits, and contributions.',
  },
  {
    icon: Bot,
    title: 'AI-Powered',
    description: 'Claude 3 Haiku extracts key facts while GPT-4o crafts professional summaries that stand out.',
  },
  {
    icon: Palette,
    title: 'Neon Design',
    description: 'State-of-the-art "Neon Tech on Black" theme designed specifically for developers and tech roles.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Generate professional CVs in under 30 seconds with our optimized AI pipeline.',
  },
  {
    icon: Shield,
    title: 'ATS-Optimized',
    description: 'Passes all Applicant Tracking Systems with proper formatting and keyword optimization.',
  },
  {
    icon: FileText,
    title: 'Multiple Formats',
    description: 'Download as PDF, share via link, or export as JSON for further customization.',
  },
];

export function Features() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Built for <span className="text-gradient">Modern Developers</span>
          </h2>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            Everything you need to create a standout CV that gets you noticed by top tech companies.
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card group hover:neon-border transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}