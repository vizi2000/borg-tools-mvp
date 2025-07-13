import { ArrowRight, Github, Bot, FileDown } from 'lucide-react';

const steps = [
  {
    icon: Github,
    title: 'Connect GitHub',
    description: 'Authenticate with GitHub OAuth to access your repositories, contributions, and profile data.',
    step: '01',
  },
  {
    icon: Bot,
    title: 'AI Processing',
    description: 'Our AI agents analyze your code, extract key skills, and generate professional summaries.',
    step: '02',
  },
  {
    icon: FileDown,
    title: 'Download CV',
    description: 'Get your professionally formatted CV as a PDF, optimized for ATS and human reviewers.',
    step: '03',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-background-card/50">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            From GitHub profile to professional CV in three simple steps.
          </p>
        </div>
        
        {/* Steps */}
        <div className="relative">
          {/* Connection lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent transform -translate-y-1/2"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step card */}
                <div className="card-neon text-center group hover:scale-105 transition-transform duration-300">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="w-8 h-8 bg-primary text-black rounded-full flex items-center justify-center font-bold text-sm">
                      {step.step}
                    </div>
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="font-display text-xl font-semibold mb-4 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
                
                {/* Arrow (hidden on mobile and last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                    <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Demo CTA */}
        <div className="text-center mt-16">
          <p className="text-text-muted mb-4">Ready to see it in action?</p>
          <button className="btn-primary">
            Try Demo
          </button>
        </div>
      </div>
    </section>
  );
}