import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

interface JWTPayload {
  user_id: string;
  github_id: number;
  username: string;
  exp: number;
}

export async function GET(request: NextRequest) {
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
    const jwtSecret = process.env.SECRET_KEY;
    if (!jwtSecret) {
      console.error('JWT secret not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    let decoded: JWTPayload;
    try {
      decoded = verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // TODO: Fetch real CV history from database
    // For now, return mock data
    const mockHistory = [
      {
        id: 'cv_1704234567890_abc123',
        user_id: decoded.user_id,
        status: 'completed',
        progress: 100,
        created_at: '2025-01-01T10:30:00Z',
        completed_at: '2025-01-01T10:31:45Z',
        result_url: 'https://storage.supabase.com/cv/mock.pdf',
        file_size: 185432,
        options: {
          maxProjects: 5,
          targetRole: 'Senior Software Engineer',
          includeLinkedIn: false
        }
      },
      {
        id: 'cv_1704134567890_def456',
        user_id: decoded.user_id,
        status: 'failed',
        progress: 30,
        created_at: '2024-12-31T15:20:00Z',
        failed_at: '2024-12-31T15:20:45Z',
        error_message: 'GitHub API rate limit exceeded',
        options: {
          maxProjects: 7,
          targetRole: 'Full Stack Developer',
          includeLinkedIn: true
        }
      },
      {
        id: 'cv_1704034567890_ghi789',
        user_id: decoded.user_id,
        status: 'processing',
        progress: 65,
        created_at: '2024-12-30T09:15:00Z',
        current_step: 'generating_summaries',
        options: {
          maxProjects: 3,
          includeLinkedIn: false
        }
      }
    ];

    return NextResponse.json({
      history: mockHistory,
      total: mockHistory.length
    });

  } catch (error) {
    console.error('CV history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}