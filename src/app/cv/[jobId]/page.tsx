'use client';

import { useAuth } from '@/components/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  CheckCircle, 
  XCircle, 
  Download,
  RefreshCw,
  Clock,
  Github,
  Brain,
  FileText,
  Upload
} from 'lucide-react';

interface CVJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  current_step?: string;
  created_at: string;
  completed_at?: string;
  failed_at?: string;
  result_url?: string;
  file_size?: number;
  error_message?: string;
  options?: any;
}

interface CVStatusPageProps {
  params: {
    jobId: string;
  };
}

export default function CVStatusPage({ params }: CVStatusPageProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<CVJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !params.jobId) return;

    const fetchJobStatus = async () => {
      try {
        // Check if this is a demo job ID
        if (params.jobId.startsWith('demo_cv_')) {
          // Simulate demo job status
          const demoJob = createDemoJob(params.jobId);
          setJob(demoJob);
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/cv/${params.jobId}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('borg_tools_token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setJob(data);
        } else if (response.status === 404) {
          setError('CV generation job not found');
        } else if (response.status === 403) {
          setError('Access denied to this CV generation job');
        } else {
          setError('Failed to fetch job status');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchJobStatus();

    // Poll for updates if job is still processing
    const interval = setInterval(() => {
      if (job?.status === 'processing') {
        fetchJobStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isAuthenticated, params.jobId, job?.status]);

  // Helper function to create demo job data
  const createDemoJob = (jobId: string): CVJob => {
    const now = Date.now();
    
    // Extract timestamp from demo job ID for consistent progress simulation
    const jobIdParts = jobId.split('_');
    const jobTimestamp = jobIdParts.length >= 3 ? parseInt(jobIdParts[2]) : now - 10000;
    const createdAt = new Date(jobTimestamp).toISOString();
    
    // Calculate progress based on time elapsed since job creation
    const timeElapsed = now - jobTimestamp;
    const secondsSinceCreation = Math.floor(timeElapsed / 1000);
    const progressPercent = Math.min(100, Math.floor(secondsSinceCreation * 3.33)); // Complete in ~30 seconds
    
    const steps = [
      { step: 'fetching_github_data', progress: 25 },
      { step: 'analyzing_repositories', progress: 45 },
      { step: 'extracting_data', progress: 65 },
      { step: 'generating_summaries', progress: 85 },
      { step: 'rendering_pdf', progress: 95 }
    ];
    
    const currentStep = steps.find(s => progressPercent < s.progress) || steps[steps.length - 1];
    
    if (progressPercent >= 100) {
      // Completed demo job
      return {
        id: jobId,
        status: 'completed',
        progress: 100,
        created_at: createdAt,
        completed_at: new Date(jobTimestamp + 30000).toISOString(), // Completed 30 seconds after creation
        result_url: '#demo-download',
        file_size: 189456,
        options: {
          maxProjects: 5,
          targetRole: 'Software Engineer',
          includeLinkedIn: false,
          includePrivateRepos: false,
          theme: 'neon-tech'
        }
      };
    }
    
    // Processing demo job
    return {
      id: jobId,
      status: 'processing',
      progress: progressPercent,
      current_step: currentStep.step,
      created_at: createdAt,
      options: {
        maxProjects: 5,
        targetRole: 'Software Engineer',
        includeLinkedIn: false,
        includePrivateRepos: false,
        theme: 'neon-tech'
      }
    };
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/dashboard" className="inline-flex items-center text-text-muted hover:text-primary mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Error</h1>
            <p className="text-text-muted mb-6">{error}</p>
            <Link href="/dashboard" className="btn-primary">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <Link href="/dashboard" className="inline-flex items-center text-text-muted hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Job Status Card */}
        <div className="bg-background-card border border-border rounded-lg p-8 mb-8">
          <div className="text-center">
            {/* Status Icon */}
            <div className="w-16 h-16 mx-auto mb-6">
              {job?.status === 'completed' && (
                <CheckCircle className="w-16 h-16 text-green-500" />
              )}
              {job?.status === 'processing' && (
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
              )}
              {job?.status === 'failed' && (
                <XCircle className="w-16 h-16 text-red-500" />
              )}
              {job?.status === 'pending' && (
                <Clock className="w-16 h-16 text-text-muted" />
              )}
            </div>

            {/* Status Text */}
            <h1 className="text-2xl font-bold mb-2">
              {job?.status === 'completed' && 'CV Ready!'}
              {job?.status === 'processing' && 'Generating Your CV...'}
              {job?.status === 'failed' && 'Generation Failed'}
              {job?.status === 'pending' && 'In Queue'}
            </h1>

            <p className="text-text-muted mb-6">
              {job?.status === 'completed' && 'Your professional CV has been generated successfully.'}
              {job?.status === 'processing' && 'Please wait while we analyze your GitHub profile and create your CV.'}
              {job?.status === 'failed' && 'Something went wrong during CV generation.'}
              {job?.status === 'pending' && 'Your CV generation request is in queue.'}
            </p>

            {/* Progress Bar */}
            {job && (job.status === 'processing' || job.status === 'pending') && (
              <div className="w-full bg-background border border-border rounded-full h-3 mb-6">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>
            )}

            {/* Current Step */}
            {job?.status === 'processing' && job.current_step && (
              <p className="text-sm text-text-muted mb-6">
                Current step: {job.current_step.replace(/_/g, ' ')}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              {job?.status === 'completed' && job.result_url && (
                <>
                  <button
                    onClick={() => {
                      if (job.result_url === '#demo-download') {
                        alert('🎉 Demo Mode: In a real implementation, your CV would download now!\n\nThe generated PDF would contain:\n• Your GitHub profile analysis\n• AI-generated professional summary\n• Top projects with descriptions\n• Technical skills extracted from repos\n• Neon Tech on Black design theme');
                      } else {
                        window.open(job.result_url, '_blank');
                      }
                    }}
                    className="btn-primary px-6 py-3"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {job.result_url === '#demo-download' ? 'Demo Download' : 'Download CV'}
                  </button>
                  <Link href="/dashboard" className="btn-secondary px-6 py-3">
                    Generate Another
                  </Link>
                </>
              )}
              
              {job?.status === 'failed' && (
                <>
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="btn-primary px-6 py-3"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Try Again
                  </button>
                  <Link href="/dashboard" className="btn-secondary px-6 py-3">
                    Back to Dashboard
                  </Link>
                </>
              )}

              {(job?.status === 'processing' || job?.status === 'pending') && (
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary px-6 py-3"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Refresh Status
                </button>
              )}
            </div>

            {/* Error Message */}
            {job?.status === 'failed' && job.error_message && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                Error: {job.error_message}
              </div>
            )}
          </div>
        </div>

        {/* Job Details */}
        {job && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Information */}
            <div className="bg-background-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Job Details</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Job ID:</span>
                  <span className="font-mono">{job.id.slice(-12)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-text-muted">Created:</span>
                  <span>{new Date(job.created_at).toLocaleString()}</span>
                </div>
                
                {job.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Completed:</span>
                    <span>{new Date(job.completed_at).toLocaleString()}</span>
                  </div>
                )}
                
                {job.file_size && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">File Size:</span>
                    <span>{Math.round(job.file_size / 1024)} KB</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-text-muted">Progress:</span>
                  <span>{job.progress}%</span>
                </div>
              </div>
            </div>

            {/* Generation Options */}
            {job.options && (
              <div className="bg-background-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Generation Options</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Max Projects:</span>
                    <span>{job.options.maxProjects || 5}</span>
                  </div>
                  
                  {job.options.targetRole && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Target Role:</span>
                      <span>{job.options.targetRole}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-text-muted">LinkedIn:</span>
                    <span>{job.options.includeLinkedIn ? 'Included' : 'Not included'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-text-muted">Private Repos:</span>
                    <span>{job.options.includePrivateRepos ? 'Included' : 'Not included'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-text-muted">Theme:</span>
                    <span className="capitalize">{job.options.theme || 'neon-tech'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Process Steps */}
        {job && (job.status === 'processing' || job.status === 'completed') && (
          <div className="mt-8 bg-background-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-6">Generation Process</h2>
            
            <div className="space-y-4">
              <ProcessStep 
                icon={<Github className="w-5 h-5" />}
                title="Fetching GitHub Data"
                description="Analyzing repositories, commits, and profile information"
                completed={job.progress > 20}
                active={job.current_step === 'fetching_github_data'}
              />
              
              <ProcessStep 
                icon={<Brain className="w-5 h-5" />}
                title="AI Analysis"
                description="Extracting technical skills and project insights"
                completed={job.progress > 50}
                active={job.current_step === 'extracting_data'}
              />
              
              <ProcessStep 
                icon={<FileText className="w-5 h-5" />}
                title="Content Generation"
                description="Creating professional summaries and descriptions"
                completed={job.progress > 80}
                active={job.current_step === 'generating_summaries'}
              />
              
              <ProcessStep 
                icon={<Upload className="w-5 h-5" />}
                title="PDF Creation"
                description="Rendering final CV and uploading to storage"
                completed={job.progress === 100}
                active={job.current_step === 'rendering_pdf'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProcessStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

function ProcessStep({ icon, title, description, completed, active }: ProcessStepProps) {
  return (
    <div className={`flex items-start space-x-4 p-4 rounded-lg transition-colors ${
      active ? 'bg-primary/5 border border-primary/20' : 
      completed ? 'bg-green-500/5' : 'bg-background'
    }`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        completed ? 'bg-green-500 text-white' :
        active ? 'bg-primary text-white' :
        'bg-background-muted text-text-muted'
      }`}>
        {completed ? <CheckCircle className="w-5 h-5" /> : icon}
      </div>
      
      <div className="flex-1">
        <h3 className={`font-medium ${
          active ? 'text-primary' : 
          completed ? 'text-green-500' : 
          'text-text'
        }`}>
          {title}
        </h3>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
      
      {active && (
        <div className="flex-shrink-0">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}