// Test file for AI agents functionality
// This can be used to test the AI agent integration

import { createCVContentGenerator, calculateContentScore } from './ai-agents';
import { ProcessedGitHubData } from './github-service';

export async function testAIAgents() {
  console.log('🧪 Testing AI Agents Integration...');
  
  try {
    // Create mock GitHub data for testing
    const mockGitHubData: ProcessedGitHubData = {
      profile: {
        name: 'Demo Developer',
        username: 'demo-dev',
        email: 'demo@example.com',
        bio: 'Full stack developer passionate about React and Node.js',
        location: 'San Francisco, CA',
        website: 'https://demo-dev.com',
        company: 'Tech Startup',
        avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
        githubUrl: 'https://github.com/demo-dev',
        joinDate: '2020-01-15T10:30:00Z',
        followers: 125,
        following: 89,
      },
      repositories: {
        total: 25,
        publicCount: 23,
        totalStars: 145,
        totalForks: 32,
        languages: [
          { name: 'TypeScript', percentage: 35, color: '#2b7489' },
          { name: 'JavaScript', percentage: 30, color: '#f1e05a' },
          { name: 'Python', percentage: 20, color: '#3572A5' },
          { name: 'HTML', percentage: 10, color: '#e34c26' },
          { name: 'CSS', percentage: 5, color: '#1572B6' },
        ],
        featured: [
          {
            name: 'awesome-react-app',
            description: 'A modern React application with TypeScript',
            url: 'https://github.com/demo-dev/awesome-react-app',
            language: 'TypeScript',
            stars: 45,
            forks: 12,
            topics: ['react', 'typescript', 'frontend'],
            lastUpdated: '2024-01-15T14:22:00Z',
          },
          {
            name: 'node-api-server',
            description: 'RESTful API server built with Node.js and Express',
            url: 'https://github.com/demo-dev/node-api-server',
            language: 'JavaScript',
            stars: 23,
            forks: 8,
            topics: ['nodejs', 'express', 'api', 'backend'],
            lastUpdated: '2024-01-10T11:30:00Z',
          },
        ],
      },
      activity: {
        totalCommits: 1250,
        recentActivity: ['Pushed to main branch', 'Opened pull request', 'Created new repository'],
        activeRepositories: 8,
        contributionPattern: 'high',
        primaryWorkingHours: 'various',
      },
      skills: {
        primaryLanguages: ['TypeScript', 'JavaScript', 'Python'],
        frameworks: ['React', 'Express.js', 'Next.js'],
        tools: ['Docker', 'AWS', 'Git', 'GitHub Actions'],
        technologies: ['Node.js', 'PostgreSQL', 'Redis', 'RESTful APIs'],
        domains: ['Web Development', 'Backend Development'],
      },
      projects: {
        showcaseProjects: [
          {
            name: 'awesome-react-app',
            description: 'A modern React application with TypeScript and real-time features',
            technologies: ['React', 'TypeScript', 'WebSocket'],
            highlights: ['45 GitHub stars', 'Real-time data synchronization', 'TypeScript for type safety'],
            url: 'https://github.com/demo-dev/awesome-react-app',
            demoUrl: 'https://awesome-react-app.demo.com',
          },
          {
            name: 'node-api-server',
            description: 'Production-ready API server with authentication and rate limiting',
            technologies: ['Node.js', 'Express.js', 'PostgreSQL'],
            highlights: ['23 GitHub stars', 'JWT authentication', 'Rate limiting middleware'],
            url: 'https://github.com/demo-dev/node-api-server',
          },
        ],
        contributionHighlights: [
          '145 total GitHub stars across projects',
          'Actively maintaining 8 repositories',
          'Polyglot developer with 5 programming languages',
        ],
        codeQualityIndicators: {
          hasTests: true,
          hasDocumentation: true,
          usesCI: true,
          followsConventions: true,
        },
      },
      summary: {
        yearsOfExperience: 4,
        primaryRole: 'Full Stack Developer',
        specializations: ['Web Development', 'React', 'Express.js'],
        professionalTraits: ['Highly productive developer', 'Actively maintains multiple projects', 'Collaborative team player'],
        achievementHighlights: ['145 GitHub stars across projects', '1250+ commits contributing to open source'],
      },
    };

    console.log('✅ Mock GitHub data created');

    // Initialize CV content generator
    const contentGenerator = createCVContentGenerator();
    console.log('✅ CV content generator initialized');

    // Test AI content generation
    console.log('🤖 Starting AI content generation test...');
    const cvContent = await contentGenerator.generateCVContent(mockGitHubData, 'Senior Full Stack Developer');
    
    console.log('✅ AI content generation completed');
    console.log('📊 Generated content overview:');
    console.log(`   📝 Professional summary: ${cvContent.professionalSummary.length} characters`);
    console.log(`   💻 Programming languages: ${cvContent.technicalSkills.programming.length} items`);
    console.log(`   🛠️ Frameworks: ${cvContent.technicalSkills.frameworks.length} items`);
    console.log(`   🔧 Tools: ${cvContent.technicalSkills.tools.length} items`);
    console.log(`   📂 Projects: ${cvContent.projects.length} items`);
    console.log(`   🏆 Achievements: ${cvContent.achievements.length} items`);
    console.log(`   🔍 ATS keywords: ${cvContent.keywords.length} items`);

    // Test content scoring
    const contentScore = calculateContentScore(cvContent);
    console.log('📊 Content quality score:', contentScore.overall);
    console.log('   Breakdown:', contentScore.breakdown);

    // Test usage statistics
    const usageStats = contentGenerator.getUsageStats();
    console.log('📈 AI agent usage stats:', usageStats);

    // Show sample generated content
    console.log('\n📋 Sample Generated Content:');
    console.log('Professional Summary:');
    console.log(`"${cvContent.professionalSummary}"`);
    
    console.log('\nTechnical Skills:');
    console.log(`Programming: ${cvContent.technicalSkills.programming.join(', ')}`);
    console.log(`Frameworks: ${cvContent.technicalSkills.frameworks.join(', ')}`);
    
    console.log('\nTop Project:');
    if (cvContent.projects.length > 0) {
      const project = cvContent.projects[0];
      console.log(`${project.name}: ${project.description}`);
      console.log(`Technologies: ${project.technologies.join(', ')}`);
      console.log(`Achievements: ${project.achievements.slice(0, 2).join(', ')}`);
    }

    return {
      success: true,
      cvContent,
      contentScore,
      usageStats,
      message: 'AI agents integration test completed successfully',
    };

  } catch (error) {
    console.error('❌ AI agents test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'ai_agents_error',
    };
  }
}

// Test function for performance measurement
export async function testAIAgentsPerformance() {
  console.log('⚡ Testing AI Agents Performance...');
  
  const startTime = Date.now();
  
  try {
    const result = await testAIAgents();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ Total execution time: ${duration}ms`);
    console.log(`📊 Performance metrics:`);
    console.log(`   Average per agent: ~${Math.round(duration / 5)}ms`);
    console.log(`   Throughput: ${duration < 10000 ? '✅ Good' : '⚠️ Slow'} (${duration}ms)`);
    
    return {
      ...result,
      performance: {
        totalTime: duration,
        avgPerAgent: Math.round(duration / 5),
        throughput: duration < 10000 ? 'good' : 'slow',
      },
    };
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Main test runner
export async function runAIAgentsTests() {
  console.log('🚀 Running AI Agents Integration Tests...\n');
  
  try {
    // Test 1: Basic functionality
    const functionalityTest = await testAIAgents();
    console.log('Test 1 - AI Agents Functionality:', functionalityTest.success ? '✅ PASS' : '❌ FAIL');
    
    // Test 2: Performance measurement
    const performanceTest = await testAIAgentsPerformance();
    console.log('Test 2 - AI Agents Performance:', performanceTest.success ? '✅ PASS' : '❌ FAIL');
    
    console.log('\n🎉 AI Agents integration tests completed!');
    
    return {
      success: true,
      results: {
        functionality: functionalityTest,
        performance: performanceTest,
      },
    };
    
  } catch (error) {
    console.error('❌ AI Agents test suite failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export test functions
export default {
  testAIAgents,
  testAIAgentsPerformance,
  runAIAgentsTests,
};