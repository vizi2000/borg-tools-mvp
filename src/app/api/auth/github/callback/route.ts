import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'GitHub OAuth not configured' },
        { status: 500 }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      return NextResponse.json(
        { error: tokenData.error_description || 'Failed to exchange code for token' },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token;

    // Get user information from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user information' },
        { status: 400 }
      );
    }

    const githubUser: GitHubUser = await userResponse.json();

    // Get user email if not public
    let userEmail = githubUser.email;
    if (!userEmail) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (emailResponse.ok) {
        const emails: GitHubEmail[] = await emailResponse.json();
        const primaryEmail = emails.find(email => email.primary && email.verified);
        userEmail = primaryEmail?.email || null;
      }
    }

    // Create user object
    const user = {
      id: `github_${githubUser.id}`,
      github_id: githubUser.id,
      username: githubUser.login,
      name: githubUser.name,
      email: userEmail,
      avatar_url: githubUser.avatar_url,
      bio: githubUser.bio,
      company: githubUser.company,
      location: githubUser.location,
      public_repos: githubUser.public_repos,
      followers: githubUser.followers,
      following: githubUser.following,
      github_token: accessToken,
      created_at: new Date().toISOString(),
    };

    // TODO: Save user to database (Supabase)
    // For now, we'll just create a JWT token

    // Create JWT token
    const jwtSecret = process.env.SECRET_KEY;
    if (!jwtSecret) {
      console.error('JWT secret not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    const token = sign(
      {
        user_id: user.id,
        github_id: user.github_id,
        username: user.username,
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      },
      jwtSecret
    );

    return NextResponse.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        public_repos: user.public_repos,
      },
    });

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}