import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || 'Authentication failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform backend response to match frontend expectations
    return NextResponse.json({
      user: {
        sub: data.user_id,
        login: data.username,
        name: data.username,
        email: data.email || null,
      }
    });

  } catch (error) {
    console.error('Auth me proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}