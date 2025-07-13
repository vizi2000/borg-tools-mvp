import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { jobs } from '../../../generate/route';

interface JWTPayload {
  user_id: string;
  github_id: number;
  username: string;
  exp: number;
}

interface CVStatusRouteProps {
  params: {
    jobId: string;
  };
}

export async function GET(request: NextRequest, { params }: CVStatusRouteProps) {
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

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Handle demo job IDs
    if (jobId.startsWith('demo_cv_')) {
      return handleDemoJob(jobId);
    }

    // Get job from storage
    const job = jobs.get(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if user owns this job
    if (job.userId !== decoded.user_id) {
      return NextResponse.json(
        { error: 'Access denied to this CV generation job' },
        { status: 403 }
      );
    }

    // Prepare response
    const response: any = {
      id: job.id,
      status: job.status,
      progress: job.progress,
      created_at: job.createdAt,
      options: job.options,
    };

    if (job.currentStep) {
      response.current_step = job.currentStep;
    }

    if (job.completedAt) {
      response.completed_at = job.completedAt;
    }

    if (job.failedAt) {
      response.failed_at = job.failedAt;
    }

    if (job.error) {
      response.error_message = job.error;
    }

    if (job.result) {
      if (job.result.pdfUrl) {
        response.result_url = job.result.pdfUrl;
      }
      if (job.result.fileSize) {
        response.file_size = job.result.fileSize;
      }
      // Include GitHub data for debugging (remove in production)
      if (process.env.NODE_ENV === 'development' && job.result.githubData) {
        response.github_data_summary = {
          profile: job.result.githubData.profile.name,
          repositories: job.result.githubData.repositories.total,
          primaryLanguages: job.result.githubData.skills.primaryLanguages.slice(0, 3),
          totalStars: job.result.githubData.repositories.totalStars,
        };
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('CV status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function handleDemoJob(jobId: string) {
  // Extract timestamp from demo job ID for consistent progress simulation
  const jobIdParts = jobId.split('_');
  const jobTimestamp = jobIdParts.length >= 3 ? parseInt(jobIdParts[2]) : Date.now() - 10000;
  const now = Date.now();
  
  // Calculate progress based on time elapsed since job creation
  const timeElapsed = now - jobTimestamp;
  const secondsSinceCreation = Math.floor(timeElapsed / 1000);
  const progressPercent = Math.min(100, Math.floor(secondsSinceCreation * 3.33)); // Complete in ~30 seconds
  
  const steps = [
    { step: 'fetching_github_data', progress: 25 },
    { step: 'analyzing_repositories', progress: 45 },
    { step: 'extracting_skills', progress: 65 },
    { step: 'generating_summaries', progress: 85 },
    { step: 'rendering_pdf', progress: 95 }
  ];
  
  const currentStep = steps.find(s => progressPercent < s.progress) || steps[steps.length - 1];
  const createdAt = new Date(jobTimestamp).toISOString();
  
  if (progressPercent >= 100) {
    // Completed demo job
    return NextResponse.json({
      id: jobId,
      status: 'completed',
      progress: 100,
      created_at: createdAt,
      completed_at: new Date(jobTimestamp + 30000).toISOString(),
      result_url: '#demo-download',
      file_size: 189456,
      options: {
        maxProjects: 5,
        targetRole: 'Software Engineer',
        includeLinkedIn: false,
        includePrivateRepos: false,
        theme: 'neon-tech'
      }
    });
  }
  
  // Processing demo job
  return NextResponse.json({
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
  });
}