import { NextRequest, NextResponse } from 'next/server';
import { openRouterService, DebugAnalysisRequest, CodeAnalysisRequest } from '@/services/openrouter';
import { z } from 'zod';

// Request validation schemas
const debugRequestSchema = z.object({
  type: z.enum(['error-analysis', 'code-analysis', 'test-generation']),
  error: z.string().optional(),
  code: z.string().optional(),
  codeContext: z.string().optional(),
  stackTrace: z.string().optional(),
  filePath: z.string().optional(),
  expectedBehavior: z.string().optional(),
  analysisType: z.enum(['bug-detection', 'performance', 'security', 'best-practices', 'testing']).optional(),
  testFramework: z.enum(['jest', 'vitest', 'playwright']).optional(),
});

type DebugRequest = z.infer<typeof debugRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedRequest = debugRequestSchema.parse(body);

    switch (validatedRequest.type) {
      case 'error-analysis':
        return await handleErrorAnalysis(validatedRequest);
      
      case 'code-analysis':
        return await handleCodeAnalysis(validatedRequest);
      
      case 'test-generation':
        return await handleTestGeneration(validatedRequest);
      
      default:
        return NextResponse.json(
          { error: 'Invalid request type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI Debug API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleErrorAnalysis(request: DebugRequest) {
  if (!request.error) {
    return NextResponse.json(
      { error: 'Error message is required for error analysis' },
      { status: 400 }
    );
  }

  const analysisRequest: DebugAnalysisRequest = {
    error: request.error,
    codeContext: request.codeContext,
    stackTrace: request.stackTrace,
    filePath: request.filePath,
    expectedBehavior: request.expectedBehavior,
  };

  const result = await openRouterService.analyzeError(analysisRequest);
  
  return NextResponse.json({
    success: true,
    type: 'error-analysis',
    result,
    timestamp: new Date().toISOString(),
  });
}

async function handleCodeAnalysis(request: DebugRequest) {
  if (!request.code) {
    return NextResponse.json(
      { error: 'Code is required for code analysis' },
      { status: 400 }
    );
  }

  const analysisRequest: CodeAnalysisRequest = {
    code: request.code,
    filePath: request.filePath || 'unknown.ts',
    analysisType: request.analysisType || 'bug-detection',
  };

  const result = await openRouterService.analyzeCode(analysisRequest);
  
  return NextResponse.json({
    success: true,
    type: 'code-analysis',
    result,
    timestamp: new Date().toISOString(),
  });
}

async function handleTestGeneration(request: DebugRequest) {
  if (!request.code) {
    return NextResponse.json(
      { error: 'Code is required for test generation' },
      { status: 400 }
    );
  }

  const result = await openRouterService.generateTests(
    request.code,
    request.filePath || 'unknown.ts',
    request.testFramework || 'vitest'
  );
  
  return NextResponse.json({
    success: true,
    type: 'test-generation',
    result: {
      testCode: result,
      framework: request.testFramework || 'vitest',
      filePath: request.filePath,
    },
    timestamp: new Date().toISOString(),
  });
}

// GET endpoint for health check and connection test
export async function GET() {
  try {
    const isConnected = await openRouterService.testConnection();
    
    return NextResponse.json({
      status: 'healthy',
      service: 'AI Debug Assistant',
      model: 'moonshotai/kimi-dev-72b:free',
      connected: isConnected,
      capabilities: [
        'error-analysis',
        'code-analysis', 
        'test-generation'
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}