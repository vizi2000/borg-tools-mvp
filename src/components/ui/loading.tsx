'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`} 
    />
  );
}

interface LoadingButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
}

export function LoadingButton({
  children,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  variant = 'primary',
}: LoadingButtonProps) {
  const baseClasses = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${className} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div className="flex items-center justify-center">
        {loading && <LoadingSpinner size="sm" className="mr-2" />}
        {children}
      </div>
    </button>
  );
}

interface LoadingPageProps {
  message?: string;
  className?: string;
}

export function LoadingPage({ 
  message = 'Loading...', 
  className = '' 
}: LoadingPageProps) {
  return (
    <div className={`min-h-screen bg-background flex items-center justify-center ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="text-primary mx-auto mb-4" />
        <p className="text-text-muted">{message}</p>
      </div>
    </div>
  );
}

interface LoadingCardProps {
  message?: string;
  className?: string;
}

export function LoadingCard({ 
  message = 'Loading...', 
  className = '' 
}: LoadingCardProps) {
  return (
    <div className={`bg-background-card border border-border rounded-lg p-8 text-center ${className}`}>
      <LoadingSpinner size="lg" className="text-primary mx-auto mb-4" />
      <p className="text-text-muted">{message}</p>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`bg-background-muted rounded h-4 ${
            i > 0 ? 'mt-2' : ''
          } ${className}`}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`bg-background-card border border-border rounded-lg p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-background-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-background-muted rounded w-3/4"></div>
            <div className="h-3 bg-background-muted rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3 mt-4">
          <div className="h-3 bg-background-muted rounded"></div>
          <div className="h-3 bg-background-muted rounded w-5/6"></div>
          <div className="h-3 bg-background-muted rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
}

interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onRetry?: () => void;
}

export function LoadingState({
  loading,
  error,
  children,
  loadingComponent,
  errorComponent,
  onRetry,
}: LoadingStateProps) {
  if (loading) {
    return loadingComponent || <LoadingCard />;
  }

  if (error) {
    return (
      errorComponent || (
        <div className="bg-background-card border border-red-500/20 rounded-lg p-6 text-center">
          <div className="text-red-500 mb-2">Error</div>
          <p className="text-text-muted mb-4">{error}</p>
          {onRetry && (
            <button onClick={onRetry} className="btn-primary">
              Try Again
            </button>
          )}
        </div>
      )
    );
  }

  return <>{children}</>;
}