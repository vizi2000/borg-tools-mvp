import { apiCall, categorizeError } from './network';

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  location: string | null;
  blog: string | null;
  company: string | null;
  avatar_url: string;
  html_url: string;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  homepage: string | null;
  language: string | null;
  languages_url: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  is_template: boolean;
  archived: boolean;
  disabled: boolean;
  visibility: 'public' | 'private';
  pushed_at: string | null;
  created_at: string;
  updated_at: string;
  default_branch: string;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string | null;
  } | null;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    url: string;
    comment_count: number;
  };
  url: string;
  html_url: string;
  author: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  } | null;
  committer: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  } | null;
}

export interface GitHubLanguageStats {
  [language: string]: number;
}

export interface GitHubContributions {
  total_count: number;
  weeks: Array<{
    week: number;
    additions: number;
    deletions: number;
    commits: number;
  }>;
}

export interface GitHubReadme {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content: string;
  encoding: string;
}

export interface GitHubProfileData {
  user: GitHubUser;
  repositories: GitHubRepository[];
  topLanguages: GitHubLanguageStats;
  totalCommits: number;
  totalStars: number;
  contributionActivity: {
    commits: number;
    additions: number;
    deletions: number;
    recentActivity: string[];
  };
  pinnedRepositories: GitHubRepository[];
  readmeFiles: Record<string, string>; // repo name -> readme content
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public rateLimitExceeded?: boolean,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

export class GitHubApiClient {
  private baseUrl = 'https://api.github.com';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      return await apiCall<T>(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Borg-Tools-CV-Generator',
          ...options.headers,
        },
      });
    } catch (error: any) {
      // Handle GitHub-specific errors
      if (error.status === 403) {
        const isRateLimit = error.message?.includes('rate limit') || 
                           error.code === 'rate_limit_exceeded';
        
        if (isRateLimit) {
          throw new GitHubApiError(
            'GitHub API rate limit exceeded. Please try again later.',
            403,
            true,
            error.retryAfter || 3600 // Default to 1 hour
          );
        }
        
        throw new GitHubApiError(
          'Access denied. Please check your GitHub token permissions.',
          403
        );
      }
      
      if (error.status === 401) {
        throw new GitHubApiError(
          'GitHub authentication failed. Please reconnect your account.',
          401
        );
      }
      
      if (error.status === 404) {
        throw new GitHubApiError(
          'GitHub resource not found.',
          404
        );
      }
      
      // Re-throw with GitHub context
      throw new GitHubApiError(
        `GitHub API error: ${error.message}`,
        error.status
      );
    }
  }

  async getUser(username?: string): Promise<GitHubUser> {
    const endpoint = username ? `/users/${username}` : '/user';
    return this.makeRequest<GitHubUser>(endpoint);
  }

  async getUserRepositories(
    username?: string,
    options: {
      type?: 'all' | 'owner' | 'public' | 'private' | 'member';
      sort?: 'created' | 'updated' | 'pushed' | 'full_name';
      direction?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<GitHubRepository[]> {
    const {
      type = 'owner',
      sort = 'updated',
      direction = 'desc',
      per_page = 100,
      page = 1,
    } = options;

    const endpoint = username ? `/users/${username}/repos` : '/user/repos';
    const params = new URLSearchParams({
      type,
      sort,
      direction,
      per_page: per_page.toString(),
      page: page.toString(),
    });

    return this.makeRequest<GitHubRepository[]>(`${endpoint}?${params}`);
  }

  async getRepositoryLanguages(owner: string, repo: string): Promise<GitHubLanguageStats> {
    return this.makeRequest<GitHubLanguageStats>(`/repos/${owner}/${repo}/languages`);
  }

  async getRepositoryCommits(
    owner: string,
    repo: string,
    options: {
      author?: string;
      since?: string;
      until?: string;
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<GitHubCommit[]> {
    const {
      author,
      since,
      until,
      per_page = 100,
      page = 1,
    } = options;

    const params = new URLSearchParams({
      per_page: per_page.toString(),
      page: page.toString(),
    });

    if (author) params.append('author', author);
    if (since) params.append('since', since);
    if (until) params.append('until', until);

    return this.makeRequest<GitHubCommit[]>(`/repos/${owner}/${repo}/commits?${params}`);
  }

  async getRepositoryReadme(owner: string, repo: string): Promise<GitHubReadme | null> {
    try {
      const readme = await this.makeRequest<GitHubReadme>(`/repos/${owner}/${repo}/readme`);
      
      // Decode base64 content
      if (readme.encoding === 'base64' && readme.content) {
        readme.content = atob(readme.content.replace(/\n/g, ''));
      }
      
      return readme;
    } catch (error: any) {
      // README not found is not an error, just return null
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getContributorStats(owner: string, repo: string): Promise<GitHubContributions[]> {
    return this.makeRequest<GitHubContributions[]>(`/repos/${owner}/${repo}/stats/contributors`);
  }

  async getUserEvents(
    username: string,
    options: {
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<any[]> {
    const { per_page = 100, page = 1 } = options;
    
    const params = new URLSearchParams({
      per_page: per_page.toString(),
      page: page.toString(),
    });

    return this.makeRequest<any[]>(`/users/${username}/events?${params}`);
  }

  // High-level method to get comprehensive profile data
  async getComprehensiveProfile(
    username?: string,
    options: {
      includePrivateRepos?: boolean;
      maxRepositories?: number;
      includeReadmes?: boolean;
    } = {}
  ): Promise<GitHubProfileData> {
    const {
      includePrivateRepos = false,
      maxRepositories = 50,
      includeReadmes = true,
    } = options;

    try {
      // Get user info
      const user = await this.getUser(username);
      
      // Get repositories
      const repoType = includePrivateRepos ? 'all' : 'public';
      const repositories = await this.getUserRepositories(username, {
        type: repoType,
        sort: 'updated',
        direction: 'desc',
        per_page: Math.min(maxRepositories, 100),
      });

      // Get language statistics
      const languageStats: GitHubLanguageStats = {};
      const readmeFiles: Record<string, string> = {};

      // Process repositories in parallel (but with rate limiting)
      const repoPromises = repositories.slice(0, maxRepositories).map(async (repo, index) => {
        // Add delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, index * 100));

        try {
          // Get languages for this repo
          const languages = await this.getRepositoryLanguages(repo.owner?.login || user.login, repo.name);
          
          // Aggregate language stats
          Object.entries(languages).forEach(([lang, bytes]) => {
            languageStats[lang] = (languageStats[lang] || 0) + bytes;
          });

          // Get README if requested
          if (includeReadmes) {
            const readme = await this.getRepositoryReadme(repo.owner?.login || user.login, repo.name);
            if (readme?.content) {
              readmeFiles[repo.name] = readme.content;
            }
          }
        } catch (error) {
          // Don't fail the entire operation if individual repo data fails
          console.warn(`Failed to get data for repo ${repo.name}:`, error);
        }
      });

      await Promise.allSettled(repoPromises);

      // Calculate contribution stats
      const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      const totalCommits = await this.estimateCommitCount(user.login, repositories.slice(0, 10));

      // Get pinned repositories (top 6 by stars)
      const pinnedRepositories = repositories
        .filter(repo => !repo.archived && !repo.disabled)
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 6);

      // Get recent activity
      const recentActivity = await this.getRecentActivity(user.login);

      return {
        user,
        repositories,
        topLanguages: languageStats,
        totalCommits,
        totalStars,
        contributionActivity: {
          commits: totalCommits,
          additions: 0, // Would need commit details for this
          deletions: 0, // Would need commit details for this
          recentActivity,
        },
        pinnedRepositories,
        readmeFiles,
      };
    } catch (error) {
      if (error instanceof GitHubApiError) {
        throw error;
      }
      
      const categorized = categorizeError(error);
      throw new GitHubApiError(
        `Failed to fetch GitHub profile: ${categorized.userMessage}`,
        error.status
      );
    }
  }

  private async estimateCommitCount(username: string, repositories: GitHubRepository[]): Promise<number> {
    let totalCommits = 0;
    
    // Sample a few repositories to estimate commit count
    const sampleRepos = repositories.slice(0, 5);
    
    for (const repo of sampleRepos) {
      try {
        const commits = await this.getRepositoryCommits(repo.owner?.login || username, repo.name, {
          author: username,
          per_page: 1,
        });
        
        // This is a rough estimate - we'd need to paginate through all commits for accuracy
        // For now, we'll use a heuristic based on repo activity
        const daysSinceCreation = Math.max(1, 
          (Date.now() - new Date(repo.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysSinceLastPush = repo.pushed_at ? 
          Math.max(1, (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24)) : 
          daysSinceCreation;
        
        // Estimate based on repo size and activity
        const estimatedCommits = Math.min(1000, Math.max(1, repo.size / 10));
        totalCommits += estimatedCommits;
      } catch (error) {
        // Skip repos we can't access
        console.warn(`Couldn't estimate commits for ${repo.name}:`, error);
      }
    }
    
    // Extrapolate to all repositories
    const extrapolationFactor = repositories.length / Math.max(1, sampleRepos.length);
    return Math.round(totalCommits * extrapolationFactor);
  }

  private async getRecentActivity(username: string): Promise<string[]> {
    try {
      const events = await this.getUserEvents(username, { per_page: 50 });
      
      const activities = events
        .filter(event => ['PushEvent', 'CreateEvent', 'IssuesEvent', 'PullRequestEvent'].includes(event.type))
        .slice(0, 10)
        .map(event => {
          const date = new Date(event.created_at).toLocaleDateString();
          switch (event.type) {
            case 'PushEvent':
              return `${date}: Pushed ${event.payload.commits?.length || 1} commits to ${event.repo.name}`;
            case 'CreateEvent':
              return `${date}: Created ${event.payload.ref_type} in ${event.repo.name}`;
            case 'IssuesEvent':
              return `${date}: ${event.payload.action} issue in ${event.repo.name}`;
            case 'PullRequestEvent':
              return `${date}: ${event.payload.action} pull request in ${event.repo.name}`;
            default:
              return `${date}: Activity in ${event.repo.name}`;
          }
        });
      
      return activities;
    } catch (error) {
      console.warn('Could not fetch recent activity:', error);
      return [];
    }
  }
}

// Utility functions
export function createGitHubClient(token: string): GitHubApiClient {
  return new GitHubApiClient(token);
}

export function analyzeLanguageStats(languages: GitHubLanguageStats): {
  topLanguages: Array<{ name: string; bytes: number; percentage: number }>;
  totalBytes: number;
  languageCount: number;
} {
  const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
  
  const topLanguages = Object.entries(languages)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  return {
    topLanguages,
    totalBytes,
    languageCount: topLanguages.length,
  };
}

export function categorizeRepositories(repositories: GitHubRepository[]): {
  activeRepos: GitHubRepository[];
  popularRepos: GitHubRepository[];
  recentRepos: GitHubRepository[];
  languageBreakdown: Record<string, number>;
} {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

  const activeRepos = repositories.filter(repo => 
    repo.pushed_at && new Date(repo.pushed_at) > sixMonthsAgo
  );

  const popularRepos = repositories
    .filter(repo => repo.stargazers_count > 0)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 10);

  const recentRepos = repositories
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const languageBreakdown: Record<string, number> = {};
  repositories.forEach(repo => {
    if (repo.language) {
      languageBreakdown[repo.language] = (languageBreakdown[repo.language] || 0) + 1;
    }
  });

  return {
    activeRepos,
    popularRepos,
    recentRepos,
    languageBreakdown,
  };
}