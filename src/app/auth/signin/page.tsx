'use client';

import Link from 'next/link';
import { Github, ArrowLeft, Play } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-context';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { loginDemo } = useAuth();
  const router = useRouter();

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    
    try {
      // Call backend API to get GitHub OAuth URL
      const response = await fetch('/api/auth/github/login');
      const data = await response.json();
      
      if (data.auth_url) {
        // Store state for CSRF protection
        localStorage.setItem('oauth_state', data.state);
        // Redirect to GitHub OAuth
        window.location.href = data.auth_url;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      setIsLoading(false);
      // TODO: Show error toast/message
    }
  };

  const handleDemoLogin = () => {
    loginDemo();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="relative w-full max-w-md">
        {/* Back to home link */}
        <Link 
          href="/" 
          className="inline-flex items-center text-text-muted hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        {/* Sign in card */}
        <div className="bg-background-card border border-border rounded-lg p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Github className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome to Borg-Tools</h1>
            <p className="text-text-muted">
              Sign in with your GitHub account to start generating professional CVs
            </p>
          </div>

          {/* GitHub OAuth button */}
          <button
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connecting...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Github className="w-5 h-5 mr-2" />
                Continue with GitHub
              </div>
            )}
          </button>

          {/* Demo Mode Button */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-text-muted text-center mb-3">
              Or try the demo without connecting your GitHub account:
            </p>
            <button
              onClick={handleDemoLogin}
              className="w-full btn-secondary py-3 text-base"
            >
              <Play className="w-4 h-4 mr-2" />
              Try Demo Mode
            </button>
            <p className="text-xs text-text-muted text-center mt-2">
              Experience the full dashboard with sample data
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-text-muted text-center mb-4">
              Why we need your GitHub account:
            </p>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Analyze your repositories and commits
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Extract your technical skills automatically
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Generate personalized CV content
              </li>
            </ul>
            <p className="text-xs text-text-muted mt-4 text-center">
              We only read public repository data. Your private repos remain private.
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className="text-xs text-text-muted text-center mt-6">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}