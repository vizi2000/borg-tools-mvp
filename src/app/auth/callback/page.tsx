'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

type AuthState = 'loading' | 'success' | 'error';

export default function AuthCallbackPage() {
  const [state, setState] = useState<AuthState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Check for OAuth errors
        if (error) {
          throw new Error(error === 'access_denied' ? 'Access denied' : 'Authentication failed');
        }

        // Validate required parameters
        if (!code || !state) {
          throw new Error('Invalid authentication parameters');
        }

        // Validate CSRF state
        const storedState = localStorage.getItem('oauth_state');
        if (state !== storedState) {
          throw new Error('Invalid state parameter');
        }

        // Exchange code for token
        const response = await fetch('/api/auth/github/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.detail || 'Authentication failed');
        }

        // Store authentication token
        if (data.access_token) {
          localStorage.setItem('borg_tools_token', data.access_token);
          setUser(data.user);
          setState('success');
          
          // Clean up OAuth state
          localStorage.removeItem('oauth_state');
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          throw new Error('No access token received');
        }

      } catch (error) {
        console.error('OAuth callback error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
        setState('error');
        
        // Clean up OAuth state
        localStorage.removeItem('oauth_state');
      }
    };

    handleOAuthCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="relative w-full max-w-md text-center">
        <div className="bg-background-card border border-border rounded-lg p-8 shadow-lg">
          
          {/* Loading State */}
          {state === 'loading' && (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h1 className="text-xl font-semibold mb-2">Authenticating...</h1>
              <p className="text-text-muted">
                Please wait while we verify your GitHub account
              </p>
            </>
          )}

          {/* Success State */}
          {state === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-xl font-semibold mb-2">Welcome to Borg-Tools!</h1>
              {user && (
                <p className="text-text-muted mb-4">
                  Hi {user.name || user.username}! Your account has been set up successfully.
                </p>
              )}
              <p className="text-sm text-text-muted">
                Redirecting to your dashboard...
              </p>
            </>
          )}

          {/* Error State */}
          {state === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-xl font-semibold mb-2">Authentication Failed</h1>
              <p className="text-text-muted mb-6">
                {errorMessage || 'Something went wrong during authentication.'}
              </p>
              
              <div className="space-y-3">
                <Link
                  href="/auth/signin"
                  className="block w-full btn-primary py-3"
                >
                  Try Again
                </Link>
                <Link
                  href="/"
                  className="block w-full btn-secondary py-3"
                >
                  Back to Home
                </Link>
              </div>
              
              {/* Common issues help */}
              <div className="mt-6 pt-6 border-t border-border text-left">
                <h3 className="text-sm font-medium mb-2">Common issues:</h3>
                <ul className="text-xs text-text-muted space-y-1">
                  <li>• Make sure you clicked "Authorize" on GitHub</li>
                  <li>• Check your internet connection</li>
                  <li>• Try using a different browser or incognito mode</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Support link */}
        <p className="text-xs text-text-muted mt-6">
          Need help?{' '}
          <Link href="/support" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}