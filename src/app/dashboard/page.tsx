'use client';

import { useAuth } from '@/components/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Github, 
  Linkedin, 
  FileText, 
  Settings, 
  LogOut, 
  User,
  Download,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { categorizeError } from '@/lib/network';
import { LoadingButton, LoadingSpinner } from '@/components/ui/loading';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, logout, isDemoMode } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-xl font-bold text-primary">Borg-Tools</div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {user.avatar_url && (
                  <img 
                    src={user.avatar_url} 
                    alt={user.name || user.username}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="text-sm">
                  <div className="font-medium">{user.name || user.username}</div>
                  <div className="text-text-muted">@{user.username}</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-text-muted hover:text-primary transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">
              Welcome back, {user.name || user.username}!
            </h1>
            {isDemoMode && (
              <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-sm font-medium">
                🎭 Demo Mode
              </span>
            )}
          </div>
          <p className="text-text-muted">
            {isDemoMode 
              ? "You're exploring Borg-Tools with sample data. Connect your GitHub for real CV generation."
              : "Generate professional CVs from your GitHub profile in seconds"
            }
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('generate')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generate'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text hover:border-border'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Generate CV
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text hover:border-border'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'generate' && <GenerateTab user={user} />}
        {activeTab === 'history' && <HistoryTab />}
      </main>
    </div>
  );
}

function GenerateTab({ user }: { user: any }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    includePrivateRepos: false,
    maxProjects: 5,
    targetRole: '',
    includeLinkedIn: false,
    linkedInUrl: '',
    theme: 'neon-tech'
  });
  const { isDemoMode } = useAuth();
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate LinkedIn URL if included
    if (formData.includeLinkedIn && formData.linkedInUrl) {
      const linkedInRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
      if (!linkedInRegex.test(formData.linkedInUrl)) {
        newErrors.linkedInUrl = 'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)';
      }
    } else if (formData.includeLinkedIn && !formData.linkedInUrl) {
      newErrors.linkedInUrl = 'LinkedIn URL is required when LinkedIn integration is enabled';
    }

    // Validate target role length
    if (formData.targetRole && formData.targetRole.length > 100) {
      newErrors.targetRole = 'Target role must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async () => {
    // Validate form first
    if (!validateForm()) {
      showErrorToast('Validation Error', 'Please fix the form errors before continuing');
      return;
    }

    setIsGenerating(true);
    
    try {
      if (isDemoMode) {
        // In demo mode, simulate CV generation
        const demoJobId = `demo_cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        showSuccessToast('Demo CV Started', 'Generating your demo CV...');
        
        // Short delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Redirect to demo status page
        window.location.href = `/cv/${demoJobId}`;
        return;
      }

      const response = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('borg_tools_token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccessToast('CV Generation Started', 'Your CV is being generated...');
        // Redirect to status page
        window.location.href = `/cv/${data.job_id}`;
      } else {
        const { userMessage } = categorizeError({ status: response.status, message: data.error });
        throw new Error(userMessage);
      }
    } catch (error: any) {
      console.error('CV generation error:', error);
      
      const { type, userMessage, isRetryable } = categorizeError(error);
      
      showErrorToast(
        'CV Generation Failed',
        isRetryable ? `${userMessage} Please try again.` : userMessage
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Generation Form */}
      <div className="space-y-6">
        <div className="bg-background-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">CV Generation Options</h2>
          
          <div className="space-y-4">
            {/* Target Role */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Role (Optional)
              </label>
              <input
                type="text"
                value={formData.targetRole}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, targetRole: e.target.value }));
                  if (errors.targetRole) {
                    setErrors(prev => ({ ...prev, targetRole: '' }));
                  }
                }}
                placeholder="e.g., Senior Software Engineer"
                className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:border-transparent ${
                  errors.targetRole 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-border focus:ring-primary'
                }`}
              />
              {errors.targetRole && (
                <p className="text-xs text-red-400 mt-1">{errors.targetRole}</p>
              )}
              <p className="text-xs text-text-muted mt-1">
                Help AI tailor your CV for specific positions
              </p>
            </div>

            {/* Max Projects */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Max Projects to Include
              </label>
              <select
                value={formData.maxProjects}
                onChange={(e) => setFormData(prev => ({ ...prev, maxProjects: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={3}>3 projects</option>
                <option value={5}>5 projects</option>
                <option value={7}>7 projects</option>
                <option value={10}>10 projects</option>
              </select>
            </div>

            {/* Private Repos */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="privateRepos"
                checked={formData.includePrivateRepos}
                onChange={(e) => setFormData(prev => ({ ...prev, includePrivateRepos: e.target.checked }))}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label htmlFor="privateRepos" className="ml-2 text-sm">
                Include private repositories
              </label>
            </div>

            {/* LinkedIn Integration */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="includeLinkedIn"
                  checked={formData.includeLinkedIn}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeLinkedIn: e.target.checked }))}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <label htmlFor="includeLinkedIn" className="ml-2 text-sm font-medium">
                  <Linkedin className="w-4 h-4 inline mr-1" />
                  Include LinkedIn Profile
                </label>
              </div>
              
              {formData.includeLinkedIn && (
                <div>
                  <input
                    type="url"
                    value={formData.linkedInUrl}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, linkedInUrl: e.target.value }));
                      if (errors.linkedInUrl) {
                        setErrors(prev => ({ ...prev, linkedInUrl: '' }));
                      }
                    }}
                    placeholder="https://linkedin.com/in/username"
                    className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.linkedInUrl 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-border focus:ring-primary'
                    }`}
                  />
                  {errors.linkedInUrl && (
                    <p className="text-xs text-red-400 mt-1">{errors.linkedInUrl}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <LoadingButton
            onClick={handleGenerate}
            loading={isGenerating}
            className="w-full mt-6 py-3"
            variant="primary"
          >
            <Github className="w-5 h-5 mr-2" />
            Generate CV
          </LoadingButton>
        </div>
      </div>

      {/* GitHub Profile Preview */}
      <div className="space-y-6">
        <div className="bg-background-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Your GitHub Profile</h2>
          
          <div className="flex items-start space-x-4">
            {user.avatar_url && (
              <img 
                src={user.avatar_url} 
                alt={user.username}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div className="flex-1">
              <h3 className="font-medium">{user.name || user.username}</h3>
              <p className="text-text-muted">@{user.username}</p>
              {user.public_repos !== undefined && (
                <p className="text-sm text-text-muted mt-2">
                  {user.public_repos} public repositories
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-2">What we'll analyze:</h4>
            <ul className="text-sm text-text-muted space-y-1">
              <li>• Repository languages and frameworks</li>
              <li>• Commit activity and contributions</li>
              <li>• Project descriptions and README files</li>
              <li>• Stars, forks, and collaboration patterns</li>
            </ul>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-primary mb-2">💡 Pro Tips</h3>
          <ul className="text-xs text-text space-y-1">
            <li>• Add detailed README files to showcase your projects</li>
            <li>• Use descriptive commit messages for better analysis</li>
            <li>• Pin your best repositories on GitHub</li>
            <li>• Add a bio and location to your GitHub profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function HistoryTab() {
  const [cvHistory, setCvHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDemoMode } = useAuth();
  const { error: showErrorToast } = useToast();

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isDemoMode) {
        // Demo mode - show sample history
        const demoHistory = [
          {
            id: 'demo_cv_completed_123',
            status: 'completed',
            created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            completed_at: new Date(Date.now() - 3500000).toISOString(),
            result_url: '#demo-download',
            file_size: 187234,
          },
          {
            id: 'demo_cv_failed_456',
            status: 'failed',
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            failed_at: new Date(Date.now() - 86300000).toISOString(),
            error_message: 'Demo: GitHub API rate limit exceeded',
          },
          {
            id: 'demo_cv_processing_789',
            status: 'processing',
            created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            progress: 75,
          }
        ];
        
        setCvHistory(demoHistory);
        return;
      }

      const response = await fetch('/api/cv/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('borg_tools_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCvHistory(data.history || []);
      } else {
        const { userMessage } = categorizeError({ status: response.status });
        throw new Error(userMessage);
      }
    } catch (error: any) {
      console.error('Failed to fetch CV history:', error);
      
      const { userMessage, isRetryable } = categorizeError(error);
      setError(userMessage);
      
      showErrorToast(
        'Failed to Load History',
        isRetryable ? `${userMessage} Please try again.` : userMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isDemoMode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to Load History</h3>
        <p className="text-text-muted mb-4">{error}</p>
        <LoadingButton
          onClick={fetchHistory}
          className="px-6 py-2"
          variant="primary"
        >
          Try Again
        </LoadingButton>
      </div>
    );
  }

  if (cvHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No CVs generated yet</h3>
        <p className="text-text-muted mb-4">
          Generate your first CV to see it appear here
        </p>
        <LoadingButton
          onClick={fetchHistory}
          className="px-6 py-2"
          variant="primary"
        >
          Refresh
        </LoadingButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cvHistory.map((cv) => (
        <div key={cv.id} className="bg-background-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {cv.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {cv.status === 'processing' && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                )}
                {cv.status === 'failed' && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>

              {/* CV Info */}
              <div>
                <h3 className="font-medium">CV #{cv.id.slice(-8)}</h3>
                <p className="text-sm text-text-muted">
                  {new Date(cv.created_at).toLocaleDateString()} at{' '}
                  {new Date(cv.created_at).toLocaleTimeString()}
                </p>
                {cv.status === 'completed' && cv.file_size && (
                  <p className="text-xs text-text-muted">
                    {Math.round(cv.file_size / 1024)} KB
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {cv.status === 'completed' && cv.result_url && (
                <button
                  onClick={() => window.open(cv.result_url, '_blank')}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
              )}
              {cv.status === 'processing' && (
                <button
                  onClick={() => window.location.href = `/cv/${cv.id}`}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  View Progress
                </button>
              )}
              {cv.status === 'failed' && (
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Retry
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {cv.status === 'failed' && cv.error_message && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
              {cv.error_message}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}