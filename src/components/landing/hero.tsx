'use client';

import Link from 'next/link';
import { Github, Zap, Download } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-context';

export function Hero() {
  const { isAuthenticated, isLoading } = useAuth();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="relative max-w-4xl mx-auto text-center">
        {/* Main heading */}
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
          <span className="text-gradient">One-Click CV</span>
          <br />
          <span className="text-white">for Developers</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-text-muted mb-8 max-w-2xl mx-auto">
          Transform your GitHub profile into a professional CV in seconds.
          AI-powered, ATS-optimized, with our signature{' '}
          <span className="text-primary font-semibold">Neon Tech on Black</span> design.
        </p>
        
        {/* Features highlight */}
        <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm md:text-base">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>{'<30s'} generation</span>
          </div>
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-primary" />
            <span>GitHub native</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            <span>ATS-ready PDF</span>
          </div>
        </div>
        
        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isLoading ? (
            <div className="btn-primary text-lg px-8 py-4 opacity-50 cursor-not-allowed">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Loading...
            </div>
          ) : isAuthenticated ? (
            <Link href="/dashboard" className="btn-primary text-lg px-8 py-4">
              <Github className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/auth/signin" className="btn-primary text-lg px-8 py-4">
              <Github className="w-5 h-5 mr-2" />
              Generate CV with GitHub
            </Link>
          )}
          <Link href="#demo" className="btn-secondary text-lg px-8 py-4">
            See Demo
          </Link>
        </div>
        
        {/* Trust indicators */}
        <p className="text-text-muted text-sm mt-8">
          Free • No credit card required • 5 CVs/month
        </p>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-2 h-16 bg-primary rounded-full animate-pulse-neon"></div>
      <div className="absolute bottom-20 right-10 w-2 h-12 bg-primary-soft rounded-full animate-pulse-neon" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-1 h-8 bg-primary rounded-full animate-pulse-neon" style={{ animationDelay: '0.5s' }}></div>
    </section>
  );
}