import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { createGitHubProcessor, GitHubApiError } from '@/lib/github-service';
import { categorizeError } from '@/lib/network';

interface JWTPayload {
  user_id: string;
  github_id: number;
  username: string;
  github_token?: string;
  exp: number;
}

interface CVGenerationRequest {
  includePrivateRepos?: boolean;
  maxProjects?: number;
  targetRole?: string;
  includeLinkedIn?: boolean;
  linkedInUrl?: string;
  theme?: string;
}

interface CVGenerationJob {
  id: string;
  userId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  options: any;
  result?: {
    githubData?: any;
    pdfUrl?: string;
    fileSize?: number;
  };
  error?: string;
}

// In-memory storage for demo purposes
// In production, this would be a database (Redis, PostgreSQL, etc.)
const jobs = new Map<string, CVGenerationJob>();

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.SECRET_KEY || 'your_jwt_secret_key';

    let decoded: JWTPayload;
    try {
      decoded = verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user has a GitHub token
    if (!decoded.github_token) {
      return NextResponse.json(
        { error: 'GitHub authentication required for CV generation' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CVGenerationRequest = await request.json();

    // Validate request
    if (body.maxProjects && (body.maxProjects < 1 || body.maxProjects > 20)) {
      return NextResponse.json(
        { error: 'Max projects must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (body.includeLinkedIn && !body.linkedInUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required when LinkedIn integration is enabled' },
        { status: 400 }
      );
    }

    if (body.linkedInUrl && !body.linkedInUrl.includes('linkedin.com/in/')) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn URL format' },
        { status: 400 }
      );
    }

    // Check for existing processing jobs for this user
    const existingJob = Array.from(jobs.values()).find(
      job => job.userId === decoded.user_id && 
             (job.status === 'queued' || job.status === 'processing')
    );

    if (existingJob) {
      return NextResponse.json(
        { 
          error: 'CV generation already in progress',
          existing_job_id: existingJob.id 
        },
        { status: 409 }
      );
    }

    // Generate job ID
    const jobId = `cv_${Date.now()}_${randomBytes(8).toString('hex')}`;

    // Create initial job entry
    const job: CVGenerationJob = {
      id: jobId,
      userId: decoded.user_id,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
      options: {
        includePrivateRepos: body.includePrivateRepos || false,
        maxProjects: body.maxProjects || 5,
        targetRole: body.targetRole || null,
        includeLinkedIn: body.includeLinkedIn || false,
        linkedInUrl: body.linkedInUrl || null,
        theme: body.theme || 'neon-tech'
      },
    };

    jobs.set(jobId, job);

    // Start CV generation process asynchronously
    processCV(jobId, decoded.github_token, decoded.username, job.options).catch(error => {
      console.error(`CV generation failed for job ${jobId}:`, error);
      
      const failedJob = jobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.failedAt = new Date().toISOString();
        
        if (error instanceof GitHubApiError) {
          failedJob.error = error.message;
        } else {
          const { userMessage } = categorizeError(error);
          failedJob.error = userMessage;
        }
        
        jobs.set(jobId, failedJob);
      }
    });

    return NextResponse.json({
      job_id: jobId,
      status: 'queued',
      estimated_completion: new Date(Date.now() + 30 * 1000).toISOString(), // 30 seconds
      message: 'CV generation started successfully'
    }, { status: 202 });

  } catch (error) {
    console.error('CV generation error:', error);
    
    const { userMessage } = categorizeError(error);
    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}

async function processCV(jobId: string, githubToken: string, username: string, options: any) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    // Update job status
    job.status = 'processing';
    job.currentStep = 'fetching_github_data';
    job.progress = 10;
    jobs.set(jobId, job);

    // Initialize GitHub processor
    const processor = createGitHubProcessor(githubToken);

    // Fetch and process GitHub data
    job.currentStep = 'analyzing_repositories';
    job.progress = 25;
    jobs.set(jobId, job);

    const githubData = await processor.processUserData(username, {
      includePrivateRepos: options.includePrivateRepos,
      maxProjects: options.maxProjects,
      targetRole: options.targetRole,
      includeLinkedIn: options.includeLinkedIn,
      linkedInUrl: options.linkedInUrl,
      theme: options.theme,
    });

    job.currentStep = 'extracting_skills';
    job.progress = 45;
    jobs.set(jobId, job);

    // Simulate processing delay for demo
    await new Promise(resolve => setTimeout(resolve, 2000));

    job.currentStep = 'generating_summaries';
    job.progress = 65;
    jobs.set(jobId, job);

    // In a real implementation, this is where you would:
    // 1. Send data to AI agents (Claude, GPT) for processing
    // 2. Generate professional summaries and descriptions
    // 3. Parse LinkedIn data if provided
    // 4. Create structured CV data

    await new Promise(resolve => setTimeout(resolve, 2000));

    job.currentStep = 'rendering_pdf';
    job.progress = 85;
    jobs.set(jobId, job);

    // In a real implementation:
    // 1. Use React-PDF or similar to generate PDF
    // 2. Apply the selected theme (neon-tech, etc.)
    // 3. Upload to storage (Supabase, S3, etc.)
    // 4. Generate shareable link

    await new Promise(resolve => setTimeout(resolve, 2000));

    job.currentStep = 'uploading_to_storage';
    job.progress = 95;
    jobs.set(jobId, job);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Complete the job
    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date().toISOString();
    job.result = {
      githubData,
      pdfUrl: `#generated-cv-${jobId}`, // Mock URL - would be real storage URL
      fileSize: Math.floor(180000 + Math.random() * 100000), // Mock file size 180-280KB
    };
    delete job.currentStep;
    
    jobs.set(jobId, job);

    console.log(`CV generation completed successfully for job ${jobId}`);

  } catch (error) {
    console.error(`Error processing CV job ${jobId}:`, error);
    
    const failedJob = jobs.get(jobId);
    if (failedJob) {
      failedJob.status = 'failed';
      failedJob.failedAt = new Date().toISOString();
      
      if (error instanceof GitHubApiError) {
        failedJob.error = error.message;
        
        // Handle rate limiting specifically
        if (error.rateLimitExceeded) {
          failedJob.error = `GitHub API rate limit exceeded. Please try again in ${Math.ceil((error.retryAfter || 3600) / 60)} minutes.`;
        }
      } else {
        const { userMessage } = categorizeError(error);
        failedJob.error = userMessage;
      }
      
      jobs.set(jobId, failedJob);
    }
    
    throw error;
  }
}

// Export jobs for access by status endpoint
export { jobs };