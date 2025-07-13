// Test file for OpenRouter integration
import { createOpenRouterClient, OpenRouterApiError, FREE_MODELS } from './openrouter-client';

export async function testOpenRouterConnection() {
  console.log('🧪 Testing OpenRouter Connection...');
  
  try {
    const client = createOpenRouterClient();
    const result = await client.testConnection();
    
    console.log('✅ OpenRouter connection successful');
    console.log(`📋 Response: "${result.response}"`);
    console.log(`🤖 Model used: ${result.model}`);
    
    return {
      success: true,
      ...result,
    };
    
  } catch (error) {
    console.error('❌ OpenRouter connection failed:', error);
    
    if (error instanceof OpenRouterApiError) {
      return {
        success: false,
        error: error.message,
        status: error.status,
        type: error.type,
        isRateLimited: error.isRateLimited,
        isModelUnavailable: error.isModelUnavailable,
        isInvalidKey: error.isInvalidKey,
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function testFreeModels() {
  console.log('🧪 Testing Free Models on OpenRouter...');
  
  const client = createOpenRouterClient();
  const results: Record<string, any> = {};
  
  // Test each free model
  for (const [modelName, modelId] of Object.entries(FREE_MODELS)) {
    console.log(`🔄 Testing ${modelName} (${modelId})...`);
    
    try {
      const response = await client.generateText(
        'You are a helpful assistant. Respond with exactly: "Model working correctly"',
        'Test this model',
        modelId,
        { max_tokens: 20, temperature: 0 }
      );
      
      results[modelName] = {
        success: true,
        model: modelId,
        response: response.slice(0, 100),
      };
      
      console.log(`✅ ${modelName}: ${response.slice(0, 50)}...`);
      
    } catch (error) {
      results[modelName] = {
        success: false,
        model: modelId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      console.log(`❌ ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const successfulModels = Object.entries(results).filter(([_, result]) => result.success);
  const failedModels = Object.entries(results).filter(([_, result]) => !result.success);
  
  console.log(`📊 Results: ${successfulModels.length}/${Object.keys(FREE_MODELS).length} models working`);
  
  if (successfulModels.length > 0) {
    console.log('✅ Working models:', successfulModels.map(([name]) => name).join(', '));
  }
  
  if (failedModels.length > 0) {
    console.log('❌ Failed models:', failedModels.map(([name]) => name).join(', '));
  }
  
  return {
    totalTested: Object.keys(FREE_MODELS).length,
    successful: successfulModels.length,
    failed: failedModels.length,
    results,
    workingModels: successfulModels.map(([name, result]) => ({ name, model: result.model })),
    recommendedModel: successfulModels.length > 0 ? successfulModels[0][1].model : null,
  };
}

export async function testCVGeneration() {
  console.log('🧪 Testing CV Content Generation with OpenRouter...');
  
  // Mock GitHub data for testing
  const mockGitHubData = {
    profile: {
      name: 'OpenRouter Test User',
      username: 'or-test-user',
      email: 'test@example.com',
      bio: 'Full stack developer passionate about AI and modern web technologies',
      location: 'San Francisco, CA',
      website: null,
      company: 'Tech Startup',
      avatarUrl: 'https://github.com/avatar.jpg',
      githubUrl: 'https://github.com/or-test-user',
      joinDate: '2020-01-01T00:00:00Z',
      followers: 150,
      following: 75,
    },
    repositories: {
      total: 20,
      publicCount: 18,
      totalStars: 200,
      totalForks: 45,
      languages: [
        { name: 'TypeScript', percentage: 40, color: '#2b7489' },
        { name: 'JavaScript', percentage: 30, color: '#f1e05a' },
        { name: 'Python', percentage: 20, color: '#3572A5' },
      ],
      featured: [],
    },
    activity: {
      totalCommits: 800,
      recentActivity: [],
      activeRepositories: 6,
      contributionPattern: 'high' as const,
      primaryWorkingHours: 'various' as const,
    },
    skills: {
      primaryLanguages: ['TypeScript', 'JavaScript', 'Python'],
      frameworks: ['React', 'Next.js', 'Express.js'],
      tools: ['Docker', 'AWS', 'Git'],
      technologies: ['Node.js', 'PostgreSQL', 'Redis'],
      domains: ['Web Development', 'Full Stack'],
    },
    projects: {
      showcaseProjects: [
        {
          name: 'ai-cv-generator',
          description: 'AI-powered CV generation tool using OpenRouter',
          technologies: ['TypeScript', 'React', 'OpenRouter'],
          highlights: ['Real-time generation', 'Multiple AI models'],
          url: 'https://github.com/or-test-user/ai-cv-generator',
        },
      ],
      contributionHighlights: ['200 GitHub stars', 'Active contributor'],
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
      specializations: ['React', 'TypeScript', 'AI Integration'],
      professionalTraits: ['Innovative', 'Collaborative'],
      achievementHighlights: ['200 GitHub stars', '800+ commits'],
    },
  };
  
  try {
    // Import and test the CV generation
    const { createCVContentGenerator } = await import('./ai-agents');
    
    const generator = createCVContentGenerator();
    console.log('🤖 Starting CV generation with OpenRouter...');
    
    const startTime = Date.now();
    const cvContent = await generator.generateCVContent(mockGitHubData as any, 'Senior Full Stack Developer');
    const endTime = Date.now();
    
    console.log(`✅ CV generation completed in ${endTime - startTime}ms`);
    console.log('📋 Generated content preview:');
    console.log(`   Summary (${cvContent.professionalSummary.length} chars): ${cvContent.professionalSummary.slice(0, 100)}...`);
    console.log(`   Skills: ${cvContent.technicalSkills.programming.join(', ')}`);
    console.log(`   Projects: ${cvContent.projects.length} projects`);
    console.log(`   Keywords: ${cvContent.keywords.length} ATS keywords`);
    
    return {
      success: true,
      generationTime: endTime - startTime,
      contentLength: {
        summary: cvContent.professionalSummary.length,
        projects: cvContent.projects.length,
        keywords: cvContent.keywords.length,
      },
      preview: {
        summary: cvContent.professionalSummary.slice(0, 200),
        topSkills: cvContent.technicalSkills.programming.slice(0, 5),
        topKeywords: cvContent.keywords.slice(0, 10),
      },
    };
    
  } catch (error) {
    console.error('❌ CV generation test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function runOpenRouterTests() {
  console.log('🚀 Running OpenRouter Integration Tests...\n');
  
  try {
    // Test 1: Basic connection
    console.log('=== Test 1: Connection Test ===');
    const connectionTest = await testOpenRouterConnection();
    console.log('Result:', connectionTest.success ? '✅ PASS' : '❌ FAIL');
    console.log('');
    
    // Test 2: Free models availability
    console.log('=== Test 2: Free Models Test ===');
    const modelsTest = await testFreeModels();
    console.log('Result:', modelsTest.successful > 0 ? '✅ PASS' : '❌ FAIL');
    console.log('');
    
    // Test 3: CV generation
    console.log('=== Test 3: CV Generation Test ===');
    const cvTest = await testCVGeneration();
    console.log('Result:', cvTest.success ? '✅ PASS' : '❌ FAIL');
    console.log('');
    
    console.log('🎉 OpenRouter integration tests completed!');
    
    return {
      success: connectionTest.success && modelsTest.successful > 0 && cvTest.success,
      results: {
        connection: connectionTest,
        models: modelsTest,
        cvGeneration: cvTest,
      },
      summary: {
        connectionWorking: connectionTest.success,
        workingModels: modelsTest.successful,
        totalModels: modelsTest.totalTested,
        cvGenerationWorking: cvTest.success,
        recommendedModel: modelsTest.recommendedModel,
      },
    };
    
  } catch (error) {
    console.error('❌ OpenRouter test suite failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export for use in other files
export default {
  testOpenRouterConnection,
  testFreeModels,
  testCVGeneration,
  runOpenRouterTests,
};