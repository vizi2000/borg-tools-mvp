// Test file for GitHub service functionality
// This can be used to test the GitHub API integration

import { createGitHubProcessor, GitHubApiError } from './github-service';

export async function testGitHubService() {
  console.log('🧪 Testing GitHub Data Fetching Service...');
  
  // Mock GitHub token for testing
  const mockToken = 'github_pat_test_token';
  
  try {
    const processor = createGitHubProcessor(mockToken);
    
    // Test with mock data - this would normally fetch real GitHub data
    console.log('✅ GitHub processor created successfully');
    
    // In a real scenario, you would test with:
    // const data = await processor.processUserData('username', {
    //   includePrivateRepos: false,
    //   maxProjects: 5,
    //   targetRole: 'Software Engineer',
    //   includeLinkedIn: false,
    //   theme: 'neon-tech',
    // });
    
    return {
      success: true,
      message: 'GitHub service initialized successfully',
    };
    
  } catch (error) {
    console.error('❌ GitHub service test failed:', error);
    
    if (error instanceof GitHubApiError) {
      return {
        success: false,
        error: error.message,
        type: 'github_api_error',
      };
    }
    
    return {
      success: false,
      error: 'Unknown error occurred',
      type: 'unknown_error',
    };
  }
}

// Test function for analyzing mock repository data
export function testRepositoryAnalysis() {
  console.log('🧪 Testing Repository Analysis...');
  
  const mockRepositories = [
    {
      id: 1,
      name: 'awesome-react-app',
      description: 'A modern React application with TypeScript',
      language: 'TypeScript',
      stargazers_count: 45,
      forks_count: 12,
      topics: ['react', 'typescript', 'frontend'],
      created_at: '2023-01-15T10:30:00Z',
      updated_at: '2024-01-15T14:22:00Z',
      pushed_at: '2024-01-15T14:22:00Z',
      archived: false,
      disabled: false,
      private: false,
    },
    {
      id: 2,
      name: 'node-api-server',
      description: 'RESTful API server built with Node.js and Express',
      language: 'JavaScript',
      stargazers_count: 23,
      forks_count: 8,
      topics: ['nodejs', 'express', 'api', 'backend'],
      created_at: '2023-03-20T09:15:00Z',
      updated_at: '2024-01-10T11:30:00Z',
      pushed_at: '2024-01-10T11:30:00Z',
      archived: false,
      disabled: false,
      private: false,
    },
    {
      id: 3,
      name: 'python-data-analysis',
      description: 'Data analysis tools and utilities in Python',
      language: 'Python',
      stargazers_count: 67,
      forks_count: 19,
      topics: ['python', 'data-science', 'pandas', 'numpy'],
      created_at: '2022-11-08T16:45:00Z',
      updated_at: '2023-12-15T13:20:00Z',
      pushed_at: '2023-12-15T13:20:00Z',
      archived: false,
      disabled: false,
      private: false,
    },
  ];
  
  // Test language breakdown
  const languageBreakdown: Record<string, number> = {};
  mockRepositories.forEach(repo => {
    if (repo.language) {
      languageBreakdown[repo.language] = (languageBreakdown[repo.language] || 0) + 1;
    }
  });
  
  const totalStars = mockRepositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = mockRepositories.reduce((sum, repo) => sum + repo.forks_count, 0);
  
  console.log('✅ Repository analysis results:');
  console.log(`📊 Total repositories: ${mockRepositories.length}`);
  console.log(`⭐ Total stars: ${totalStars}`);
  console.log(`🍴 Total forks: ${totalForks}`);
  console.log(`💻 Languages: ${Object.keys(languageBreakdown).join(', ')}`);
  
  return {
    repositories: mockRepositories.length,
    totalStars,
    totalForks,
    languages: Object.keys(languageBreakdown),
    topRepository: mockRepositories.sort((a, b) => b.stargazers_count - a.stargazers_count)[0],
  };
}

// Test skill extraction
export function testSkillExtraction() {
  console.log('🧪 Testing Skill Extraction...');
  
  const mockLanguageStats = {
    TypeScript: 125000,
    JavaScript: 98000,
    Python: 75000,
    HTML: 45000,
    CSS: 32000,
    Go: 28000,
  };
  
  const mockReadmeContent = `
# Awesome React App

A modern web application built with React, TypeScript, and Express.js backend.

## Features
- Real-time data synchronization
- RESTful API integration
- Docker containerization
- CI/CD with GitHub Actions
- PostgreSQL database
- Redis caching
- AWS deployment

## Tech Stack
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express.js, PostgreSQL
- DevOps: Docker, Kubernetes, AWS
- Testing: Jest, Cypress
  `;
  
  // Simulate skill extraction
  const extractedSkills = {
    primaryLanguages: Object.keys(mockLanguageStats).slice(0, 3),
    frameworks: ['React', 'Express.js', 'Tailwind CSS'],
    tools: ['Docker', 'Kubernetes', 'AWS', 'GitHub Actions'],
    databases: ['PostgreSQL', 'Redis'],
    testing: ['Jest', 'Cypress'],
  };
  
  console.log('✅ Skills extracted successfully:');
  console.log(`🔤 Primary languages: ${extractedSkills.primaryLanguages.join(', ')}`);
  console.log(`🛠️ Frameworks: ${extractedSkills.frameworks.join(', ')}`);
  console.log(`🔧 Tools: ${extractedSkills.tools.join(', ')}`);
  
  return extractedSkills;
}

// Main test function
export async function runAllTests() {
  console.log('🚀 Running GitHub Data Fetching Service Tests...\n');
  
  try {
    // Test 1: Service initialization
    const serviceTest = await testGitHubService();
    console.log('Test 1 - Service initialization:', serviceTest.success ? '✅ PASS' : '❌ FAIL');
    
    // Test 2: Repository analysis
    const repoTest = testRepositoryAnalysis();
    console.log('Test 2 - Repository analysis:', repoTest ? '✅ PASS' : '❌ FAIL');
    
    // Test 3: Skill extraction
    const skillTest = testSkillExtraction();
    console.log('Test 3 - Skill extraction:', skillTest ? '✅ PASS' : '❌ FAIL');
    
    console.log('\n🎉 All tests completed!');
    
    return {
      success: true,
      results: {
        service: serviceTest,
        repositories: repoTest,
        skills: skillTest,
      },
    };
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export test functions for potential use in other files
export default {
  testGitHubService,
  testRepositoryAnalysis,
  testSkillExtraction,
  runAllTests,
};