// Simple OpenRouter test script
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

console.log('🧪 Testing OpenRouter Integration...');

// Check environment variables
console.log('✅ Environment check:');
console.log('  - API Key present:', !!process.env.OPENROUTER_API_KEY);
console.log('  - Key prefix:', process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.substring(0, 15) + '...' : 'Not found');

async function testOpenRouter() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('❌ No OpenRouter API key found');
    return;
  }

  try {
    // Test 1: List models
    console.log('\n🔍 Testing API access...');
    const modelsResponse = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!modelsResponse.ok) {
      console.log('❌ Failed to access OpenRouter API:', modelsResponse.status, modelsResponse.statusText);
      return;
    }

    const modelsData = await modelsResponse.json();
    console.log(`✅ API accessible - found ${modelsData.data ? modelsData.data.length : 'unknown'} models`);

    // Find free models
    const freeModels = modelsData.data ? modelsData.data.filter(model => 
      model.id.includes(':free') || model.pricing?.prompt === '0'
    ) : [];
    
    console.log(`🆓 Free models available: ${freeModels.length}`);
    if (freeModels.length > 0) {
      console.log('   Top free models:');
      freeModels.slice(0, 5).forEach(model => {
        console.log(`   - ${model.id} (${model.name || 'No name'})`);
      });
    }

    // Test 2: Simple chat completion
    console.log('\n🤖 Testing chat completion...');
    const testModel = 'mistralai/mistral-7b-instruct:free';
    
    const chatResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3004',
        'X-Title': 'Borg-Tools CV Generator Test',
      },
      body: JSON.stringify({
        model: testModel,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "OpenRouter test successful!" and nothing else.' }
        ],
        max_tokens: 20,
        temperature: 0,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.log('❌ Chat completion failed:', chatResponse.status, errorText);
      return;
    }

    const chatData = await chatResponse.json();
    const responseText = chatData.choices?.[0]?.message?.content || 'No response';
    
    console.log('✅ Chat completion successful');
    console.log(`   Model: ${chatData.model || testModel}`);
    console.log(`   Response: "${responseText}"`);
    console.log(`   Tokens used: ${chatData.usage?.total_tokens || 'unknown'}`);

    return true;

  } catch (error) {
    console.log('❌ Error testing OpenRouter:', error.message);
    return false;
  }
}

// Run the test
testOpenRouter().then(success => {
  console.log('\n🎉 OpenRouter test completed:', success ? 'SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test script error:', error);
  process.exit(1);
});