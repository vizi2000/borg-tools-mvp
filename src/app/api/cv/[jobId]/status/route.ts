import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

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

    // TODO: Fetch real job status from database
    // For now, return mock data based on job ID pattern
    
    // Simulate different job states for demo
    let mockJob;
    
    if (jobId.includes('completed')) {
      mockJob = {
        id: jobId,
        user_id: decoded.user_id,
        status: 'completed',
        progress: 100,
        created_at: '2025-01-12T10:30:00Z',
        completed_at: '2025-01-12T10:31:45Z',
        result_url: 'https://storage.supabase.com/cv/sample.pdf',
        file_size: 185432,
        options: {
          maxProjects: 5,
          targetRole: 'Senior Software Engineer',
          includeLinkedIn: false,
          includePrivateRepos: false,
          theme: 'neon-tech'
        }
      };
    } else if (jobId.includes('failed')) {
      mockJob = {
        id: jobId,
        user_id: decoded.user_id,
        status: 'failed',
        progress: 30,
        created_at: '2025-01-12T10:25:00Z',
        failed_at: '2025-01-12T10:25:45Z',
        error_message: 'GitHub API rate limit exceeded. Please try again in a few minutes.',
        options: {
          maxProjects: 7,
          targetRole: 'Full Stack Developer',
          includeLinkedIn: true,
          includePrivateRepos: false,
          theme: 'neon-tech'
        }
      };
    } else {
      // Simulate processing job with dynamic progress
      const timeElapsed = Date.now() - 1640000000000; // Mock start time
      const progressSteps = [
        { step: 'fetching_github_data', progress: 25 },
        { step: 'analyzing_repositories', progress: 45 },
        { step: 'extracting_data', progress: 65 },
        { step: 'generating_summaries', progress: 85 },
        { step: 'rendering_pdf', progress: 95 }
      ];
      
      const currentStepIndex = Math.floor((timeElapsed % 60000) / 12000); // Change step every 12 seconds
      const currentStep = progressSteps[Math.min(currentStepIndex, progressSteps.length - 1)];
      
      mockJob = {
        id: jobId,
        user_id: decoded.user_id,
        status: 'processing',
        progress: currentStep.progress,
        current_step: currentStep.step,
        created_at: '2025-01-12T10:30:00Z',
        estimated_completion: new Date(Date.now() + 90000).toISOString(), // 90 seconds from now
        options: {
          maxProjects: 5,
          targetRole: 'Software Engineer',
          includeLinkedIn: false,
          includePrivateRepos: false,
          theme: 'neon-tech'
        }
      };
    }

    // Check if job belongs to the authenticated user
    if (mockJob.user_id !== decoded.user_id) {
      return NextResponse.json(
        { error: 'Access denied to this CV generation job' },
        { status: 403 }
      );
    }

    return NextResponse.json(mockJob);

  } catch (error) {
    console.error('CV status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}