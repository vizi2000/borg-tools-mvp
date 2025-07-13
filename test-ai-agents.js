// Simple test script for AI agents functionality
const { runAIAgentsTests } = require('./src/lib/ai-agents-test.ts');

async function testAIAgents() {
  console.log('🧪 Testing AI Agents Integration...\n');
  
  try {
    // Import the test functions
    const aiAgentsTest = await import('./src/lib/ai-agents-test.ts');
    
    // Run the tests
    const results = await aiAgentsTest.runAIAgentsTests();
    
    console.log('\n📊 Test Results Summary:');
    console.log('Success:', results.success ? '✅' : '❌');
    
    if (results.success && results.results) {
      if (results.results.functionality) {
        console.log('Functionality Test: ✅ PASSED');
        if (results.results.functionality.cvContent) {
          console.log(`  - Generated CV content with ${results.results.functionality.cvContent.projects.length} projects`);
          console.log(`  - Professional summary: ${results.results.functionality.cvContent.professionalSummary.slice(0, 100)}...`);
          console.log(`  - Quality score: ${results.results.functionality.contentScore?.overall}%`);
        }
      }
      
      if (results.results.performance) {
        console.log('Performance Test: ✅ PASSED');
        if (results.results.performance.performance) {
          console.log(`  - Total time: ${results.results.performance.performance.totalTime}ms`);
          console.log(`  - Throughput: ${results.results.performance.performance.throughput}`);
        }
      }
    }
    
    if (results.error) {
      console.log('Error:', results.error);
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
if (require.main === module) {
  testAIAgents().then(results => {
    console.log('\n🎉 Test completed!');
    process.exit(results.success ? 0 : 1);
  });
}

module.exports = { testAIAgents };