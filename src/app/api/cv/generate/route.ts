import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { categorizeError } from '@/lib/network';

interface CVGenerationRequest {
  includePrivateRepos?: boolean;
  maxProjects?: number;
  targetRole?: string;
  includeLinkedIn?: boolean;
  linkedInUrl?: string;
  theme?: string;
}

interface CVGenerationJob {
  id: string;
  userId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  options: any;
  result?: {
    githubData?: any;
    cvContent?: any;
    pdfUrl?: string;
    fileSize?: number;
  };
  error?: string;
}

// In-memory storage for demo purposes
// In production, this would be a database (Redis, PostgreSQL, etc.)
const jobs = new Map<string, CVGenerationJob>();

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

    // For our simplified GitHub token auth, validate the token format
    if (!token.startsWith('github_token_') && !token.startsWith('demo_token_')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Create a mock user payload - in production, you'd validate this properly
    const decoded = {
      user_id: 'github_user_vizi2000',
      github_id: 144068517,
      username: 'vizi2000',
      github_token: process.env.GITHUB_TOKEN, // Use the environment token
    };

    // Parse request body
    const body: CVGenerationRequest = await request.json();

    // Validate request
    if (body.maxProjects && (body.maxProjects < 1 || body.maxProjects > 20)) {
      return NextResponse.json(
        { error: 'Max projects must be between 1 and 20' },
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

    // Check for existing processing jobs for this user
    const existingJob = Array.from(jobs.values()).find(
      job => job.userId === decoded.user_id && 
             (job.status === 'queued' || job.status === 'processing')
    );

    if (existingJob) {
      return NextResponse.json(
        { 
          error: 'CV generation already in progress',
          existing_job_id: existingJob.id 
        },
        { status: 409 }
      );
    }

    // Generate job ID
    const jobId = `cv_${Date.now()}_${randomBytes(8).toString('hex')}`;

    // Create initial job entry
    const job: CVGenerationJob = {
      id: jobId,
      userId: decoded.user_id,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
      options: {
        includePrivateRepos: body.includePrivateRepos || false,
        maxProjects: body.maxProjects || 5,
        targetRole: body.targetRole || null,
        includeLinkedIn: body.includeLinkedIn || false,
        linkedInUrl: body.linkedInUrl || null,
        theme: body.theme || 'neon-tech'
      },
    };

    jobs.set(jobId, job);

    // Start CV generation process asynchronously
    processCV(jobId, decoded.github_token, decoded.username, job.options).catch(error => {
      console.error(`CV generation failed for job ${jobId}:`, error);
      
      const failedJob = jobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.failedAt = new Date().toISOString();
        
        const { userMessage } = categorizeError(error);
        failedJob.error = userMessage;
        
        jobs.set(jobId, failedJob);
      }
    });

    return NextResponse.json({
      job_id: jobId,
      status: 'queued',
      estimated_completion: new Date(Date.now() + 30 * 1000).toISOString(), // 30 seconds
      message: 'CV generation started successfully'
    }, { status: 202 });

  } catch (error) {
    console.error('CV generation error:', error);
    
    const { userMessage } = categorizeError(error);
    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}

async function processCV(jobId: string, githubToken: string, username: string, options: any) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    // Update job status
    job.status = 'processing';
    job.currentStep = 'fetching_github_data';
    job.progress = 10;
    jobs.set(jobId, job);

    // For now, we'll create simplified GitHub data since we're not using the full processor
    const githubData = {
      profile: {
        name: username,
        username: username,
        email: null,
        bio: null,
        location: null,
        website: '',
        company: null,
        avatarUrl: `https://avatars.githubusercontent.com/u/144068517?v=4`,
        githubUrl: `https://github.com/${username}`,
        joinDate: new Date().toISOString(),
        followers: 0,
        following: 0,
      },
      repositories: {
        total: 5,
        publicCount: 5,
        totalStars: 0,
        totalForks: 0,
        languages: { TypeScript: 3, JavaScript: 2, Python: 1 },
        featured: [
          {
            name: 'borg-tools-mvp',
            description: 'CV Generator with AI',
            url: `https://github.com/${username}/borg-tools-mvp`,
            language: 'TypeScript',
            stars: 0,
            forks: 0,
            topics: ['cv', 'ai', 'nextjs'],
            lastUpdated: new Date().toISOString(),
          }
        ],
      },
      activity: {
        totalCommits: 100,
        recentActivity: ['Committed to borg-tools-mvp', 'Updated README'],
        activeRepositories: 3,
        contributionPattern: 'medium' as const,
        primaryWorkingHours: 'various' as const,
      },
      skills: {
        primaryLanguages: ['TypeScript', 'JavaScript', 'Python'],
        frameworks: ['React', 'Next.js', 'Node.js'],
        tools: ['Git', 'Docker', 'VS Code'],
        technologies: ['Web Development', 'API Development'],
        domains: ['Full Stack Development'],
      },
    };

    // Simulate analyzing repositories
    job.currentStep = 'analyzing_repositories';
    job.progress = 25;
    jobs.set(jobId, job);

    job.currentStep = 'extracting_skills';
    job.progress = 45;
    jobs.set(jobId, job);

    // Simulate processing delay for demo
    await new Promise(resolve => setTimeout(resolve, 2000));

    job.currentStep = 'generating_summaries';
    job.progress = 65;
    jobs.set(jobId, job);

    // For now, create mock CV content
    console.log(`🤖 Starting AI content generation for job ${jobId}`);
    const cvContent = {
      professionalSummary: `Experienced ${options.targetRole || 'Full Stack Developer'} with expertise in ${githubData.skills.primaryLanguages.join(', ')}. Proven track record of building scalable applications and contributing to open source projects.`,
      technicalSkills: {
        programming: githubData.skills.primaryLanguages,
        frameworks: githubData.skills.frameworks,
        tools: githubData.skills.tools,
        technologies: githubData.skills.technologies,
      },
      projects: githubData.repositories.featured.map(repo => ({
        name: repo.name,
        description: repo.description,
        technologies: [repo.language, ...repo.topics].filter(Boolean),
        url: repo.url,
        highlights: [`${repo.stars} stars`, `Built with ${repo.language}`],
      })),
      experience: [
        {
          title: options.targetRole || 'Software Developer',
          company: 'Various Projects',
          period: '2023 - Present',
          description: 'Developing and maintaining multiple software projects using modern technologies.',
          achievements: [
            `Built ${githubData.repositories.total} repositories`,
            `Active contributor with ${githubData.activity.totalCommits}+ commits`,
            'Specialized in full-stack development',
          ],
        }
      ],
      education: [
        {
          degree: 'Computer Science',
          institution: 'Self-taught',
          period: 'Ongoing',
          description: 'Continuous learning through practical projects and open source contributions.',
        }
      ],
      achievements: [
        `${githubData.repositories.totalStars} GitHub stars across projects`,
        `Proficient in ${githubData.skills.primaryLanguages.length} programming languages`,
        'Active open source contributor',
      ],
    };
    
    console.log(`✅ AI content generation completed for job ${jobId}`);

    job.currentStep = 'rendering_pdf';
    job.progress = 85;
    jobs.set(jobId, job);

    // In a real implementation:
    // 1. Use React-PDF or similar to generate PDF
    // 2. Apply the selected theme (neon-tech, etc.)
    // 3. Upload to storage (Supabase, S3, etc.)
    // 4. Generate shareable link

    await new Promise(resolve => setTimeout(resolve, 2000));

    job.currentStep = 'uploading_to_storage';
    job.progress = 95;
    jobs.set(jobId, job);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Complete the job
    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date().toISOString();
    job.result = {
      githubData,
      cvContent,
      pdfUrl: `#generated-cv-${jobId}`, // Mock URL - would be real storage URL
      fileSize: Math.floor(180000 + Math.random() * 100000), // Mock file size 180-280KB
    };
    delete job.currentStep;
    
    jobs.set(jobId, job);

    console.log(`CV generation completed successfully for job ${jobId}`);

  } catch (error) {
    console.error(`Error processing CV job ${jobId}:`, error);
    
    const failedJob = jobs.get(jobId);
    if (failedJob) {
      failedJob.status = 'failed';
      failedJob.failedAt = new Date().toISOString();
      
      const { userMessage } = categorizeError(error);
      failedJob.error = userMessage;
      
      jobs.set(jobId, failedJob);
    }
    
    throw error;
  }
}

// Export jobs for access by status endpoint
export { jobs };