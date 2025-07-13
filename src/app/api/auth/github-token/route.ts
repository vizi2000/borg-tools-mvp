import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Test the token by fetching user data directly from GitHub API
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Borg-Tools-CV-Generator',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid GitHub token' },
          { status: 401 }
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'GitHub API rate limit exceeded' },
          { status: 429 }
        );
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const userData = await response.json();
    
    // Fetch user's repositories
    const reposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=20', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Borg-Tools-CV-Generator',
      },
    });

    let repositories = [];
    if (reposResponse.ok) {
      repositories = await reposResponse.json();
    }

    // Create a simplified user object for authentication
    const user = {
      id: userData.id.toString(),
      username: userData.login,
      name: userData.name || userData.login,
      email: userData.email,
      avatar_url: userData.avatar_url,
      public_repos: userData.public_repos,
    };

    // Create simplified GitHub data for CV generation
    const processedData = {
      profile: {
        name: userData.name || userData.login,
        username: userData.login,
        email: userData.email,
        bio: userData.bio,
        location: userData.location,
        website: userData.blog,
        company: userData.company,
        avatarUrl: userData.avatar_url,
        githubUrl: userData.html_url,
        joinDate: userData.created_at,
        followers: userData.followers,
        following: userData.following,
      },
      repositories: {
        total: repositories.length,
        publicCount: repositories.filter((r: any) => !r.private).length,
        totalStars: repositories.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0),
        totalForks: repositories.reduce((sum: number, repo: any) => sum + repo.forks_count, 0),
        languages: repositories
          .map((r: any) => r.language)
          .filter(Boolean)
          .reduce((acc: any, lang: string) => {
            acc[lang] = (acc[lang] || 0) + 1;
            return acc;
          }, {}),
        featured: repositories.slice(0, 5).map((repo: any) => ({
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          topics: repo.topics || [],
          lastUpdated: repo.updated_at,
        })),
      },
    };

    return NextResponse.json({
      success: true,
      user,
      github_data: processedData,
      token: 'github_token_' + Date.now(),
    });

  } catch (error: any) {
    console.error('GitHub token authentication error:', error);
    
    return NextResponse.json(
      { error: 'Failed to authenticate with GitHub: ' + error.message },
      { status: 500 }
    );
  }
}