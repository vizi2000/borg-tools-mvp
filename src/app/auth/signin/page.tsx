'use client';

import Link from 'next/link';
import { Github, ArrowLeft, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { categorizeError } from '@/lib/network';
import { LoadingButton } from '@/components/ui/loading';

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginDemo } = useAuth();
  const router = useRouter();
  const { error: showErrorToast } = useToast();

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call backend API to get GitHub OAuth URL
      const response = await fetch('/api/auth/github/login');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.auth_url) {
        // Store state for CSRF protection
        localStorage.setItem('oauth_state', data.state);
        // Redirect to GitHub OAuth
        window.location.href = data.auth_url;
      } else {
        throw new Error('Invalid response: missing authorization URL');
      }
    } catch (error: any) {
      console.error('GitHub sign-in error:', error);
      
      const { type, userMessage, isRetryable } = categorizeError(error);
      
      setError(userMessage);
      setIsLoading(false);
      
      // Show toast notification for better UX
      showErrorToast(
        'Sign-in Failed',
        isRetryable ? `${userMessage} Please try again.` : userMessage
      );
    }
  };

  const handleDemoLogin = () => {
    try {
      loginDemo();
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Demo login error:', error);
      showErrorToast('Demo Failed', 'Unable to start demo mode. Please refresh and try again.');
    }
  };

  const handleRetry = () => {
    setError(null);
    handleGitHubSignIn();
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

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-400">{error}</p>
                  {categorizeError({ message: error }).isRetryable && (
                    <button
                      onClick={handleRetry}
                      className="mt-2 text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Try again
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* GitHub OAuth button */}
          <LoadingButton
            onClick={handleGitHubSignIn}
            loading={isLoading}
            className="w-full py-4 text-lg"
            variant="primary"
          >
            <Github className="w-5 h-5 mr-2" />
            Continue with GitHub
          </LoadingButton>

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