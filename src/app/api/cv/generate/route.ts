import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { randomBytes } from 'crypto';

interface JWTPayload {
  user_id: string;
  github_id: number;
  username: string;
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

    // Parse request body
    const body: CVGenerationRequest = await request.json();

    // Validate request
    if (body.maxProjects && (body.maxProjects < 1 || body.maxProjects > 10)) {
      return NextResponse.json(
        { error: 'Max projects must be between 1 and 10' },
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

    // TODO: Check rate limiting
    // For now, we'll implement a simple in-memory rate limiter
    
    // Generate job ID
    const jobId = `cv_${Date.now()}_${randomBytes(8).toString('hex')}`;

    // TODO: Store job in database with status 'pending'
    // TODO: Start background processing
    
    // For now, return mock response
    const jobData = {
      id: jobId,
      user_id: decoded.user_id,
      status: 'processing',
      progress: 0,
      created_at: new Date().toISOString(),
      options: {
        includePrivateRepos: body.includePrivateRepos || false,
        maxProjects: body.maxProjects || 5,
        targetRole: body.targetRole || null,
        includeLinkedIn: body.includeLinkedIn || false,
        linkedInUrl: body.linkedInUrl || null,
        theme: body.theme || 'neon-tech'
      }
    };

    // TODO: Start background CV generation process
    // backgroundCVGeneration(jobData);

    return NextResponse.json({
      job_id: jobId,
      status: 'processing',
      estimated_completion: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes from now
      message: 'CV generation started successfully'
    }, { status: 202 });

  } catch (error) {
    console.error('CV generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}