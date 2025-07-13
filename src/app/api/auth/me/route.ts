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
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.SECRET_KEY;
    if (!jwtSecret) {
      console.error('JWT secret not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    try {
      const decoded = verify(token, jwtSecret) as JWTPayload;
      
      // TODO: Fetch full user data from database
      // For now, return basic info from JWT
      const userData = {
        id: decoded.user_id,
        github_id: decoded.github_id,
        username: decoded.username,
      };

      return NextResponse.json(userData);

    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}