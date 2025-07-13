import { ProcessedGitHubData } from './github-service';

// AI Agent Types and Interfaces
export interface AgentConfig {
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface AgentResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface CVContent {
  professionalSummary: string;
  technicalSkills: {
    programming: string[];
    frameworks: string[];
    tools: string[];
    databases: string[];
  };
  experience: {
    title: string;
    description: string;
    highlights: string[];
    yearsOfExperience: number;
  };
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    achievements: string[];
    url?: string;
  }>;
  education?: {
    inferred: boolean;
    description: string;
  };
  achievements: string[];
  keywords: string[]; // For ATS optimization
}

// Agent Configurations
export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  SUMMARY_GENERATOR: {
    name: 'Professional Summary Generator',
    model: 'claude-3-haiku-20240307',
    temperature: 0.7,
    maxTokens: 500,
    systemPrompt: `You are an expert CV writer specializing in creating compelling professional summaries for software developers. 

Your task is to analyze GitHub profile data and create a professional summary that:
1. Highlights the developer's primary expertise and technologies
2. Quantifies their experience and contributions
3. Emphasizes their most impressive achievements
4. Uses industry-standard terminology
5. Is ATS-optimized with relevant keywords
6. Sounds professional and confident without being boastful

Keep the summary concise (3-4 sentences, max 150 words) and focus on what makes this developer unique and valuable to potential employers.`
  },

  EXPERIENCE_WRITER: {
    name: 'Experience Description Writer',
    model: 'gpt-4o-mini',
    temperature: 0.6,
    maxTokens: 800,
    systemPrompt: `You are a professional CV writer specializing in translating GitHub activity into compelling work experience descriptions.

Your task is to create professional experience entries that:
1. Transform repository work into professional accomplishments
2. Use action verbs and quantified results
3. Highlight technical leadership and collaboration
4. Emphasize problem-solving and innovation
5. Include relevant technologies and methodologies
6. Follow standard CV formatting conventions

Focus on demonstrating impact, growth, and technical expertise through concrete examples derived from the GitHub data.`
  },

  PROJECT_ENHANCER: {
    name: 'Project Description Enhancer',
    model: 'claude-3-haiku-20240307',
    temperature: 0.5,
    maxTokens: 600,
    systemPrompt: `You are a technical writer specializing in creating compelling project descriptions for developer portfolios.

Your task is to enhance project descriptions by:
1. Highlighting technical complexity and innovation
2. Explaining the problem solved and impact achieved
3. Showcasing specific technologies and architectures used
4. Quantifying results where possible (users, performance, etc.)
5. Demonstrating technical skills and best practices
6. Making the description engaging and professional

Transform basic repository information into compelling project narratives that demonstrate the developer's capabilities and impact.`
  },

  SKILLS_ORGANIZER: {
    name: 'Technical Skills Organizer',
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 400,
    systemPrompt: `You are an expert in organizing and categorizing technical skills for software developer CVs.

Your task is to:
1. Categorize technologies into logical groups (Languages, Frameworks, Tools, etc.)
2. Prioritize skills based on proficiency and market demand
3. Ensure ATS optimization with proper keywords
4. Remove redundancies and group related technologies
5. Present skills in order of importance and relevance
6. Include both technical and soft skills where applicable

Create a well-organized, comprehensive skills section that accurately represents the developer's capabilities.`
  },

  ATS_OPTIMIZER: {
    name: 'ATS Optimization Specialist',
    model: 'gpt-4o-mini',
    temperature: 0.2,
    maxTokens: 300,
    systemPrompt: `You are an ATS (Applicant Tracking System) optimization expert specializing in developer CVs.

Your task is to:
1. Identify relevant industry keywords and technologies
2. Suggest keyword placement throughout the CV
3. Ensure proper formatting for ATS parsing
4. Optimize for common developer job requirements
5. Balance keyword density with natural language
6. Include variations of technology names (React.js, ReactJS, React)

Provide specific recommendations to improve ATS compatibility while maintaining readability and professionalism.`
  }
};

// Mock AI Agent Implementation
// In a real implementation, these would call actual AI APIs (OpenAI, Anthropic, etc.)
export class AIAgent {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async process(prompt: string, data: any): Promise<AgentResponse> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Mock response based on agent type
    const content = this.generateMockResponse(prompt, data);
    
    return {
      content,
      usage: {
        promptTokens: Math.floor(Math.random() * 500) + 100,
        completionTokens: Math.floor(Math.random() * 300) + 50,
        totalTokens: Math.floor(Math.random() * 800) + 150,
      },
      metadata: {
        model: this.config.model,
        temperature: this.config.temperature,
        timestamp: new Date().toISOString(),
      }
    };
  }

  private generateMockResponse(prompt: string, data: any): string {
    const agentName = this.config.name;

    switch (agentName) {
      case 'Professional Summary Generator':
        return this.generateProfessionalSummary(data);
      
      case 'Experience Description Writer':
        return this.generateExperienceDescription(data);
      
      case 'Project Description Enhancer':
        return this.generateProjectDescriptions(data);
      
      case 'Technical Skills Organizer':
        return this.generateSkillsOrganization(data);
      
      case 'ATS Optimization Specialist':
        return this.generateATSOptimization(data);
      
      default:
        return 'AI-generated content based on GitHub profile analysis.';
    }
  }

  private generateProfessionalSummary(data: ProcessedGitHubData): string {
    const { profile, repositories, skills, summary } = data;
    
    return `Experienced ${summary.primaryRole} with ${summary.yearsOfExperience}+ years of expertise in ${skills.primaryLanguages.slice(0, 3).join(', ')}. Proven track record of building scalable applications with ${repositories.totalStars}+ GitHub stars across ${repositories.total} repositories. Specializes in ${skills.frameworks.slice(0, 2).join(' and ')} development with strong foundations in ${skills.technologies.slice(0, 3).join(', ')}. Passionate about clean code, performance optimization, and delivering user-centric solutions that drive business impact.`;
  }

  private generateExperienceDescription(data: ProcessedGitHubData): string {
    const { skills, activity, repositories } = data;
    
    return `**Software Developer** | ${activity.contributionPattern === 'high' ? 'Highly Active' : 'Active'} Open Source Contributor
    
• Developed and maintained ${repositories.total}+ repositories using ${skills.primaryLanguages.slice(0, 3).join(', ')}, achieving ${repositories.totalStars} stars and ${repositories.totalForks} forks from the developer community
• Architected scalable applications using ${skills.frameworks.slice(0, 3).join(', ')}, focusing on performance optimization and code quality
• Collaborated on ${activity.activeRepositories} active projects, contributing ${activity.totalCommits}+ commits and driving continuous integration practices
• Implemented modern development workflows using ${skills.tools.slice(0, 3).join(', ')}, reducing deployment time and improving code reliability
• Mentored junior developers through open source contributions and maintained comprehensive documentation for ${Math.floor(repositories.total * 0.6)} projects`;
  }

  private generateProjectDescriptions(data: ProcessedGitHubData): string {
    const projects = data.projects.showcaseProjects.slice(0, 3);
    
    return projects.map(project => `
**${project.name}**
${project.description}

*Technical Implementation:* Built using ${project.technologies.slice(0, 4).join(', ')}, this project demonstrates advanced ${project.technologies[0]} development skills and modern software architecture principles.

*Key Achievements:*
${project.highlights.map(highlight => `• ${highlight}`).join('\n')}

*Impact:* This project showcases expertise in full-stack development, problem-solving capabilities, and commitment to building production-quality applications.
    `).join('\n---\n');
  }

  private generateSkillsOrganization(data: ProcessedGitHubData): string {
    const { skills } = data;
    
    return `**Programming Languages:**
${skills.primaryLanguages.join(' • ')}

**Frameworks & Libraries:**
${skills.frameworks.join(' • ')}

**Tools & Technologies:**
${skills.tools.join(' • ')}

**Development Practices:**
Agile Development • Git Version Control • CI/CD • Test-Driven Development • Code Review • Documentation

**Soft Skills:**
Problem Solving • Team Collaboration • Technical Communication • Project Management • Continuous Learning`;
  }

  private generateATSOptimization(data: ProcessedGitHubData): string {
    const { skills, summary } = data;
    
    const keywords = [
      ...skills.primaryLanguages,
      ...skills.frameworks,
      ...skills.tools,
      summary.primaryRole,
      'Software Development',
      'Full Stack',
      'Agile',
      'Git',
      'API Development',
      'Database Design',
      'Code Review',
      'Problem Solving'
    ];

    return `**ATS Keywords to Include:**
${keywords.slice(0, 20).join(' • ')}

**Optimization Recommendations:**
• Include variations of technology names (React, React.js, ReactJS)
• Use both acronyms and full forms (API, Application Programming Interface)
• Include industry-standard terms and methodologies
• Ensure skills appear in multiple sections for keyword density
• Use action verbs: Developed, Implemented, Architected, Optimized, Led
• Include quantifiable achievements and metrics where possible`;
  }
}

// AI Agent Orchestrator
export class CVContentGenerator {
  private agents: Map<string, AIAgent>;

  constructor() {
    this.agents = new Map();
    
    // Initialize all agents
    Object.entries(AGENT_CONFIGS).forEach(([key, config]) => {
      this.agents.set(key, new AIAgent(config));
    });
  }

  async generateCVContent(githubData: ProcessedGitHubData, targetRole?: string): Promise<CVContent> {
    console.log('🤖 Starting AI-powered CV content generation...');

    try {
      // Generate content using different AI agents
      const [
        professionalSummary,
        experienceDescription,
        projectDescriptions,
        skillsOrganization,
        atsOptimization
      ] = await Promise.all([
        this.agents.get('SUMMARY_GENERATOR')!.process(
          `Generate a professional summary for a ${targetRole || githubData.summary.primaryRole}`,
          githubData
        ),
        this.agents.get('EXPERIENCE_WRITER')!.process(
          'Convert GitHub activity into professional experience entries',
          githubData
        ),
        this.agents.get('PROJECT_ENHANCER')!.process(
          'Enhance project descriptions for maximum impact',
          githubData
        ),
        this.agents.get('SKILLS_ORGANIZER')!.process(
          'Organize and categorize technical skills',
          githubData
        ),
        this.agents.get('ATS_OPTIMIZER')!.process(
          'Optimize CV content for ATS systems',
          githubData
        )
      ]);

      console.log('✅ AI content generation completed');

      // Process and structure the generated content
      return this.structureCVContent(
        githubData,
        professionalSummary.content,
        experienceDescription.content,
        projectDescriptions.content,
        skillsOrganization.content,
        atsOptimization.content
      );

    } catch (error) {
      console.error('❌ AI content generation failed:', error);
      throw new Error(`Failed to generate CV content: ${error}`);
    }
  }

  private structureCVContent(
    githubData: ProcessedGitHubData,
    summary: string,
    experience: string,
    projects: string,
    skills: string,
    atsKeywords: string
  ): CVContent {
    // Extract structured data from AI responses
    const skillsLines = skills.split('\n').filter(line => line.trim());
    const keywordsMatch = atsKeywords.match(/ATS Keywords to Include:\*\*\n(.+)/s);
    const keywords = keywordsMatch 
      ? keywordsMatch[1].split('•').map(k => k.trim()).filter(Boolean)
      : githubData.skills.primaryLanguages;

    return {
      professionalSummary: summary.trim(),
      
      technicalSkills: {
        programming: githubData.skills.primaryLanguages,
        frameworks: githubData.skills.frameworks,
        tools: githubData.skills.tools,
        databases: githubData.skills.technologies.filter(tech => 
          tech.toLowerCase().includes('sql') || 
          tech.toLowerCase().includes('mongo') ||
          tech.toLowerCase().includes('redis')
        ),
      },

      experience: {
        title: githubData.summary.primaryRole,
        description: experience.replace(/\*\*/g, '').trim(),
        highlights: githubData.summary.achievementHighlights,
        yearsOfExperience: githubData.summary.yearsOfExperience,
      },

      projects: githubData.projects.showcaseProjects.map(project => ({
        name: project.name,
        description: project.description,
        technologies: project.technologies,
        achievements: project.highlights,
        url: project.url,
      })),

      education: {
        inferred: true,
        description: `Self-taught developer with ${githubData.summary.yearsOfExperience}+ years of hands-on experience in software development, demonstrated through extensive open-source contributions and practical project implementations.`,
      },

      achievements: [
        ...githubData.summary.achievementHighlights,
        ...githubData.projects.contributionHighlights,
      ],

      keywords: keywords.slice(0, 30), // Top 30 ATS keywords
    };
  }

  // Helper method to get agent usage statistics
  getUsageStats(): Record<string, any> {
    return {
      totalAgents: this.agents.size,
      availableAgents: Array.from(this.agents.keys()),
      lastGeneration: new Date().toISOString(),
    };
  }
}

// Factory function
export function createCVContentGenerator(): CVContentGenerator {
  return new CVContentGenerator();
}

// Utility functions for content processing
export function optimizeForATS(content: string, keywords: string[]): string {
  let optimized = content;
  
  // Add keyword variations
  keywords.forEach(keyword => {
    if (!optimized.toLowerCase().includes(keyword.toLowerCase())) {
      // Add keyword naturally to content
      optimized += ` ${keyword}`;
    }
  });

  return optimized;
}

export function calculateContentScore(content: CVContent): {
  overall: number;
  breakdown: Record<string, number>;
} {
  const scores = {
    summary: content.professionalSummary.length > 100 ? 100 : content.professionalSummary.length,
    skills: Math.min(100, content.technicalSkills.programming.length * 20),
    experience: content.experience.highlights.length * 25,
    projects: Math.min(100, content.projects.length * 33),
    keywords: Math.min(100, content.keywords.length * 3),
  };

  const overall = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;

  return {
    overall: Math.round(overall),
    breakdown: scores,
  };
}