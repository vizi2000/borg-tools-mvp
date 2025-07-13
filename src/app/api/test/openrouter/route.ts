import { NextRequest, NextResponse } from 'next/server';
import { runOpenRouterTests } from '@/lib/openrouter-test';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Running OpenRouter tests from API route...');
    
    // Run the OpenRouter tests server-side where env vars are accessible
    const results = await runOpenRouterTests();
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ OpenRouter API test error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testType } = await request.json();
    
    console.log(`🧪 Running ${testType} test from API route...`);
    
    if (testType === 'connection') {
      const { testOpenRouterConnection } = await import('@/lib/openrouter-test');
      const result = await testOpenRouterConnection();
      return NextResponse.json(result);
    }
    
    if (testType === 'models') {
      const { testFreeModels } = await import('@/lib/openrouter-test');
      const result = await testFreeModels();
      return NextResponse.json(result);
    }
    
    if (testType === 'cv-generation') {
      const { testCVGeneration } = await import('@/lib/openrouter-test');
      const result = await testCVGeneration();
      return NextResponse.json(result);
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid test type' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('❌ OpenRouter API test error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}