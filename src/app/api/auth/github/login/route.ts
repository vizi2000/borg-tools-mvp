import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // GitHub OAuth configuration
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'GitHub OAuth not configured' },
        { status: 500 }
      );
    }

    // Generate CSRF state
    const state = randomBytes(32).toString('hex');
    
    // GitHub OAuth URL with required scopes
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'read:user user:email public_repo');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('allow_signup', 'true');

    return NextResponse.json({
      auth_url: authUrl.toString(),
      state: state,
    });

  } catch (error) {
    console.error('GitHub OAuth login error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}