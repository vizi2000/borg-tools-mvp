import { 
  GitHubApiClient, 
  GitHubProfileData, 
  GitHubApiError,
  analyzeLanguageStats,
  categorizeRepositories,
  createGitHubClient 
} from './github-api';

export interface ProcessedGitHubData {
  // Core profile info
  profile: {
    name: string;
    username: string;
    email: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    company: string | null;
    avatarUrl: string;
    githubUrl: string;
    joinDate: string;
    followers: number;
    following: number;
  };

  // Repository statistics
  repositories: {
    total: number;
    publicCount: number;
    totalStars: number;
    totalForks: number;
    languages: Array<{
      name: string;
      percentage: number;
      color?: string;
    }>;
    featured: Array<{
      name: string;
      description: string | null;
      url: string;
      language: string | null;
      stars: number;
      forks: number;
      topics: string[];
      lastUpdated: string;
    }>;
  };

  // Activity and contributions
  activity: {
    totalCommits: number;
    recentActivity: string[];
    activeRepositories: number;
    contributionPattern: 'high' | 'medium' | 'low';
    primaryWorkingHours: 'morning' | 'afternoon' | 'evening' | 'various';
  };

  // Skills and technologies
  skills: {
    primaryLanguages: string[]; // Top 3-5 languages
    frameworks: string[];
    tools: string[];
    technologies: string[];
    domains: string[]; // web, mobile, data science, etc.
  };

  // Project insights
  projects: {
    showcaseProjects: Array<{
      name: string;
      description: string;
      technologies: string[];
      highlights: string[];
      url: string;
      demoUrl?: string;
      readme?: string;
    }>;
    contributionHighlights: string[];
    codeQualityIndicators: {
      hasTests: boolean;
      hasDocumentation: boolean;
      usesCI: boolean;
      followsConventions: boolean;
    };
  };

  // Professional summary data
  summary: {
    yearsOfExperience: number;
    primaryRole: string; // inferred from activity
    specializations: string[];
    professionalTraits: string[];
    achievementHighlights: string[];
  };
}

export interface CVGenerationOptions {
  includePrivateRepos: boolean;
  maxProjects: number;
  targetRole?: string;
  includeLinkedIn: boolean;
  linkedInUrl?: string;
  theme: string;
}

// Language to color mapping for better visualization
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#2b7489',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#239120',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#fa7343',
  Kotlin: '#F18E33',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#1572B6',
  SCSS: '#c6538c',
  Vue: '#4FC08D',
  React: '#61DAFB',
  Angular: '#DD0031',
  Svelte: '#ff3e00',
};

// Framework and technology detection patterns
const TECHNOLOGY_PATTERNS = {
  frameworks: {
    'React': ['react', 'jsx', 'create-react-app'],
    'Vue.js': ['vue', 'vuejs', 'nuxt'],
    'Angular': ['angular', '@angular'],
    'Next.js': ['next', 'nextjs'],
    'Express.js': ['express'],
    'Django': ['django'],
    'Flask': ['flask'],
    'FastAPI': ['fastapi'],
    'Spring': ['spring', 'spring-boot'],
    'Laravel': ['laravel'],
    'Rails': ['rails', 'ruby-on-rails'],
    'ASP.NET': ['asp.net', 'dotnet'],
  },
  tools: {
    'Docker': ['docker', 'dockerfile'],
    'Kubernetes': ['kubernetes', 'k8s'],
    'AWS': ['aws', 'amazon-web-services'],
    'Google Cloud': ['gcp', 'google-cloud'],
    'Azure': ['azure', 'microsoft-azure'],
    'Git': ['git', 'github', 'gitlab'],
    'CI/CD': ['github-actions', 'jenkins', 'travis', 'circleci'],
    'Terraform': ['terraform'],
    'Ansible': ['ansible'],
  },
  domains: {
    'Web Development': ['web', 'frontend', 'backend', 'fullstack'],
    'Mobile Development': ['mobile', 'ios', 'android', 'react-native', 'flutter'],
    'Data Science': ['data-science', 'machine-learning', 'ai', 'ml'],
    'DevOps': ['devops', 'infrastructure', 'deployment'],
    'Game Development': ['game', 'unity', 'unreal'],
    'Blockchain': ['blockchain', 'web3', 'cryptocurrency'],
  },
};

export class GitHubDataProcessor {
  private client: GitHubApiClient;

  constructor(token: string) {
    this.client = createGitHubClient(token);
  }

  async processUserData(
    username?: string,
    options: CVGenerationOptions = {
      includePrivateRepos: false,
      maxProjects: 10,
      theme: 'neon-tech',
      includeLinkedIn: false,
    }
  ): Promise<ProcessedGitHubData> {
    try {
      // Fetch comprehensive GitHub data
      const githubData = await this.client.getComprehensiveProfile(username, {
        includePrivateRepos: options.includePrivateRepos,
        maxRepositories: Math.max(options.maxProjects * 2, 20), // Get more than needed for filtering
        includeReadmes: true,
      });

      // Process the data
      return this.transformGitHubData(githubData, options);
    } catch (error) {
      if (error instanceof GitHubApiError) {
        throw error;
      }
      throw new GitHubApiError(`Failed to process GitHub data: ${error}`);
    }
  }

  private transformGitHubData(
    data: GitHubProfileData,
    options: CVGenerationOptions
  ): ProcessedGitHubData {
    // Process profile information
    const profile = this.extractProfile(data.user);
    
    // Analyze repositories
    const repositoryAnalysis = this.analyzeRepositories(data.repositories, options.maxProjects);
    
    // Extract skills and technologies
    const skills = this.extractSkills(data.repositories, data.topLanguages, data.readmeFiles);
    
    // Analyze activity patterns
    const activity = this.analyzeActivity(data, repositoryAnalysis.activeRepos);
    
    // Generate project insights
    const projects = this.generateProjectInsights(
      data.repositories, 
      data.readmeFiles, 
      options.maxProjects
    );
    
    // Create professional summary
    const summary = this.generateProfessionalSummary(data, skills, activity, options.targetRole);

    return {
      profile,
      repositories: repositoryAnalysis,
      activity,
      skills,
      projects,
      summary,
    };
  }

  private extractProfile(user: any) {
    return {
      name: user.name || user.login,
      username: user.login,
      email: user.email,
      bio: user.bio,
      location: user.location,
      website: user.blog,
      company: user.company,
      avatarUrl: user.avatar_url,
      githubUrl: user.html_url,
      joinDate: user.created_at,
      followers: user.followers,
      following: user.following,
    };
  }

  private analyzeRepositories(repositories: any[], maxProjects: number) {
    const { activeRepos, popularRepos, languageBreakdown } = categorizeRepositories(repositories);
    const publicRepos = repositories.filter(repo => !repo.private);
    
    // Calculate language statistics
    const totalRepos = repositories.length;
    const languages = Object.entries(languageBreakdown)
      .map(([name, count]) => ({
        name,
        percentage: (count / totalRepos) * 100,
        color: LANGUAGE_COLORS[name] || '#6366f1',
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8); // Top 8 languages

    // Select featured repositories
    const featured = popularRepos
      .slice(0, maxProjects)
      .map(repo => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        topics: repo.topics || [],
        lastUpdated: repo.updated_at,
      }));

    return {
      total: repositories.length,
      publicCount: publicRepos.length,
      totalStars: repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      totalForks: repositories.reduce((sum, repo) => sum + repo.forks_count, 0),
      languages,
      featured,
    };
  }

  private extractSkills(repositories: any[], languageStats: any, readmeFiles: Record<string, string>) {
    // Primary languages based on usage
    const languageAnalysis = analyzeLanguageStats(languageStats);
    const primaryLanguages = languageAnalysis.topLanguages
      .slice(0, 5)
      .map(lang => lang.name);

    // Extract technologies from repository names, descriptions, and READMEs
    const allText = [
      ...repositories.map(repo => `${repo.name} ${repo.description || ''} ${repo.topics?.join(' ') || ''}`),
      ...Object.values(readmeFiles),
    ].join(' ').toLowerCase();

    const frameworks = this.extractTechnologies(allText, TECHNOLOGY_PATTERNS.frameworks);
    const tools = this.extractTechnologies(allText, TECHNOLOGY_PATTERNS.tools);
    const domains = this.extractTechnologies(allText, TECHNOLOGY_PATTERNS.domains);

    // Infer additional technologies from file patterns and repo structure
    const technologies = [
      ...frameworks,
      ...tools,
      ...this.inferTechnologiesFromRepos(repositories),
    ];

    return {
      primaryLanguages,
      frameworks,
      tools,
      technologies: [...new Set(technologies)], // Remove duplicates
      domains,
    };
  }

  private extractTechnologies(text: string, patterns: Record<string, string[]>): string[] {
    const found: string[] = [];
    
    Object.entries(patterns).forEach(([tech, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        found.push(tech);
      }
    });
    
    return found;
  }

  private inferTechnologiesFromRepos(repositories: any[]): string[] {
    const technologies: string[] = [];
    
    repositories.forEach(repo => {
      // Check package.json indicators
      if (repo.name.includes('package.json') || repo.description?.includes('npm')) {
        technologies.push('Node.js');
      }
      
      // Check for common patterns
      if (repo.name.includes('api') || repo.description?.includes('api')) {
        technologies.push('RESTful APIs');
      }
      
      if (repo.topics?.includes('typescript')) {
        technologies.push('TypeScript');
      }
      
      if (repo.topics?.includes('graphql')) {
        technologies.push('GraphQL');
      }
    });
    
    return [...new Set(technologies)];
  }

  private analyzeActivity(data: GitHubProfileData, activeRepos: any[]) {
    const { user, contributionActivity } = data;
    
    // Determine contribution pattern
    const reposPerYear = data.repositories.length / Math.max(1, 
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)
    );
    
    let contributionPattern: 'high' | 'medium' | 'low';
    if (reposPerYear > 10 || contributionActivity.commits > 500) {
      contributionPattern = 'high';
    } else if (reposPerYear > 3 || contributionActivity.commits > 100) {
      contributionPattern = 'medium';
    } else {
      contributionPattern = 'low';
    }

    return {
      totalCommits: contributionActivity.commits,
      recentActivity: contributionActivity.recentActivity,
      activeRepositories: activeRepos.length,
      contributionPattern,
      primaryWorkingHours: 'various' as const, // Would need commit timestamps to determine
    };
  }

  private generateProjectInsights(
    repositories: any[], 
    readmeFiles: Record<string, string>, 
    maxProjects: number
  ) {
    // Select showcase projects
    const showcaseProjects = repositories
      .filter(repo => !repo.archived && !repo.disabled)
      .sort((a, b) => {
        // Prioritize repos with stars, recent activity, and good descriptions
        const scoreA = a.stargazers_count * 2 + (a.description ? 10 : 0) + (readmeFiles[a.name] ? 5 : 0);
        const scoreB = b.stargazers_count * 2 + (b.description ? 10 : 0) + (readmeFiles[b.name] ? 5 : 0);
        return scoreB - scoreA;
      })
      .slice(0, maxProjects)
      .map(repo => {
        const readme = readmeFiles[repo.name];
        const technologies = [
          repo.language,
          ...(repo.topics || []),
        ].filter(Boolean);

        return {
          name: repo.name,
          description: repo.description || 'No description provided',
          technologies,
          highlights: this.extractProjectHighlights(repo, readme),
          url: repo.html_url,
          demoUrl: repo.homepage || undefined,
          readme: readme ? this.summarizeReadme(readme) : undefined,
        };
      });

    // Generate contribution highlights
    const contributionHighlights = this.generateContributionHighlights(repositories);

    // Assess code quality indicators
    const codeQualityIndicators = this.assessCodeQuality(repositories, readmeFiles);

    return {
      showcaseProjects,
      contributionHighlights,
      codeQualityIndicators,
    };
  }

  private extractProjectHighlights(repo: any, readme?: string): string[] {
    const highlights: string[] = [];
    
    if (repo.stargazers_count > 10) {
      highlights.push(`${repo.stargazers_count} GitHub stars`);
    }
    
    if (repo.forks_count > 5) {
      highlights.push(`${repo.forks_count} forks from community`);
    }
    
    if (repo.topics?.length > 0) {
      highlights.push(`Technologies: ${repo.topics.slice(0, 3).join(', ')}`);
    }
    
    if (readme) {
      // Extract key features from README
      const features = this.extractFeaturesFromReadme(readme);
      highlights.push(...features.slice(0, 2));
    }
    
    return highlights;
  }

  private extractFeaturesFromReadme(readme: string): string[] {
    const features: string[] = [];
    
    // Look for bullet points or numbered lists
    const lines = readme.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[*-]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        const feature = trimmed.replace(/^[*-]\s+/, '').replace(/^\d+\.\s+/, '');
        if (feature.length > 10 && feature.length < 100) {
          features.push(feature);
        }
      }
    }
    
    return features.slice(0, 5);
  }

  private summarizeReadme(readme: string): string {
    // Extract first meaningful paragraph
    const paragraphs = readme.split('\n\n');
    const meaningfulParagraph = paragraphs.find(p => 
      p.trim().length > 50 && 
      !p.includes('# ') && 
      !p.includes('##') &&
      !p.includes('```')
    );
    
    return meaningfulParagraph?.trim().slice(0, 300) || '';
  }

  private generateContributionHighlights(repositories: any[]): string[] {
    const highlights: string[] = [];
    
    const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    if (totalStars > 50) {
      highlights.push(`${totalStars} total GitHub stars across projects`);
    }
    
    const activeRepos = repositories.filter(repo => {
      const lastUpdate = new Date(repo.updated_at);
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
      return lastUpdate > sixMonthsAgo;
    });
    
    if (activeRepos.length > 5) {
      highlights.push(`Actively maintaining ${activeRepos.length} repositories`);
    }
    
    const languages = [...new Set(repositories.map(repo => repo.language).filter(Boolean))];
    if (languages.length > 3) {
      highlights.push(`Polyglot developer with ${languages.length} programming languages`);
    }
    
    return highlights;
  }

  private assessCodeQuality(repositories: any[], readmeFiles: Record<string, string>) {
    const hasTests = repositories.some(repo => 
      repo.topics?.includes('testing') || 
      repo.name.includes('test') ||
      Object.values(readmeFiles).some(readme => 
        readme.toLowerCase().includes('test') || 
        readme.toLowerCase().includes('jest') ||
        readme.toLowerCase().includes('pytest')
      )
    );

    const hasDocumentation = Object.keys(readmeFiles).length > repositories.length * 0.3;

    const usesCI = repositories.some(repo => 
      repo.topics?.includes('ci') || 
      repo.topics?.includes('github-actions') ||
      Object.values(readmeFiles).some(readme => 
        readme.includes('github-actions') || 
        readme.includes('ci/cd')
      )
    );

    const followsConventions = repositories.some(repo => 
      repo.topics?.includes('conventional-commits') ||
      repo.name.includes('conventional')
    );

    return {
      hasTests,
      hasDocumentation,
      usesCI,
      followsConventions,
    };
  }

  private generateProfessionalSummary(
    data: GitHubProfileData,
    skills: any,
    activity: any,
    targetRole?: string
  ) {
    const { user } = data;
    
    // Calculate years of experience
    const accountAge = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
    const yearsOfExperience = Math.max(1, Math.round(accountAge));
    
    // Infer primary role
    const primaryRole = this.inferPrimaryRole(skills, targetRole);
    
    // Determine specializations
    const specializations = [
      ...skills.domains.slice(0, 2),
      ...skills.frameworks.slice(0, 3),
    ];
    
    // Generate professional traits
    const professionalTraits = this.generateProfessionalTraits(activity, data.repositories.length);
    
    // Create achievement highlights
    const achievementHighlights = this.generateAchievementHighlights(data, activity);
    
    return {
      yearsOfExperience,
      primaryRole,
      specializations,
      professionalTraits,
      achievementHighlights,
    };
  }

  private inferPrimaryRole(skills: any, targetRole?: string): string {
    if (targetRole) {
      return targetRole;
    }
    
    const { primaryLanguages, frameworks, domains } = skills;
    
    // Web development indicators
    if (frameworks.some(f => ['React', 'Vue.js', 'Angular', 'Next.js'].includes(f))) {
      return 'Full Stack Developer';
    }
    
    if (primaryLanguages.includes('JavaScript') || primaryLanguages.includes('TypeScript')) {
      return 'Frontend Developer';
    }
    
    // Backend indicators
    if (frameworks.some(f => ['Django', 'Flask', 'Express.js', 'FastAPI'].includes(f))) {
      return 'Backend Developer';
    }
    
    // Data science indicators
    if (primaryLanguages.includes('Python') && domains.includes('Data Science')) {
      return 'Data Scientist';
    }
    
    // Mobile development
    if (domains.includes('Mobile Development')) {
      return 'Mobile Developer';
    }
    
    // DevOps indicators
    if (domains.includes('DevOps')) {
      return 'DevOps Engineer';
    }
    
    // Default based on primary language
    if (primaryLanguages[0]) {
      return `${primaryLanguages[0]} Developer`;
    }
    
    return 'Software Developer';
  }

  private generateProfessionalTraits(activity: any, repoCount: number): string[] {
    const traits: string[] = [];
    
    if (activity.contributionPattern === 'high') {
      traits.push('Highly productive developer');
    }
    
    if (repoCount > 20) {
      traits.push('Prolific open source contributor');
    }
    
    if (activity.activeRepositories > 5) {
      traits.push('Actively maintains multiple projects');
    }
    
    traits.push('Collaborative team player');
    traits.push('Continuous learner');
    
    return traits;
  }

  private generateAchievementHighlights(data: GitHubProfileData, activity: any): string[] {
    const highlights: string[] = [];
    
    if (data.totalStars > 100) {
      highlights.push(`${data.totalStars} GitHub stars across projects`);
    }
    
    if (activity.totalCommits > 1000) {
      highlights.push(`${activity.totalCommits}+ commits contributing to open source`);
    }
    
    if (data.repositories.length > 50) {
      highlights.push(`${data.repositories.length} repositories showcasing diverse skills`);
    }
    
    const popularRepo = data.repositories
      .sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
    
    if (popularRepo?.stargazers_count > 10) {
      highlights.push(`Created ${popularRepo.name} with ${popularRepo.stargazers_count} stars`);
    }
    
    return highlights;
  }
}

// Factory function for easier usage
export function createGitHubProcessor(token: string): GitHubDataProcessor {
  return new GitHubDataProcessor(token);
}