import OpenAI from 'openai';

export interface DebugAnalysisRequest {
  error: string;
  codeContext?: string;
  stackTrace?: string;
  filePath?: string;
  expectedBehavior?: string;
}

export interface DebugAnalysisResponse {
  analysis: string;
  rootCause: string;
  suggestedFix: string;
  codeChanges?: Array<{
    file: string;
    action: 'create' | 'update' | 'delete';
    content: string;
    explanation: string;
  }>;
  preventionTips: string[];
  confidence: number;
}

export interface CodeAnalysisRequest {
  code: string;
  filePath: string;
  analysisType: 'bug-detection' | 'performance' | 'security' | 'best-practices' | 'testing';
}

export interface CodeAnalysisResponse {
  issues: Array<{
    type: 'error' | 'warning' | 'suggestion';
    line?: number;
    message: string;
    suggestedFix: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  suggestions: string[];
  codeQualityScore: number;
}

export class OpenRouterService {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn('⚠️ OPENROUTER_API_KEY not found, AI features will be disabled');
      this.client = null as any;
      return;
    }

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3003',
        'X-Title': process.env.OPENROUTER_SITE_NAME || 'Borg-Tools-MVP',
      },
    });
  }

  /**
   * Analyze errors and provide debug assistance using Kimi-Dev-72B
   */
  async analyzeError(request: DebugAnalysisRequest): Promise<DebugAnalysisResponse> {
    if (!this.client) {
      return {
        analysis: 'AI analysis unavailable - API key not configured',
        rootCause: 'OpenRouter API key not found',
        suggestedFix: 'Configure OPENROUTER_API_KEY environment variable',
        preventionTips: ['Set up proper environment configuration'],
        confidence: 0
      };
    }
    const systemPrompt = `You are Kimi-Dev-72B, a specialized software engineering assistant. Your expertise is in:
1. Analyzing bugs and errors with 60.4% success rate on SWE-bench
2. Providing specific, actionable fixes with file locations
3. Understanding code context and root cause analysis
4. Suggesting prevention strategies

Respond with a structured JSON analysis containing:
- analysis: Detailed explanation of the issue
- rootCause: The fundamental reason for the error
- suggestedFix: Step-by-step solution
- codeChanges: Array of specific file changes (if applicable)
- preventionTips: How to avoid similar issues
- confidence: Your confidence level (0-100)`;

    const userPrompt = `Please analyze this error and provide a comprehensive solution:

ERROR: ${request.error}

${request.stackTrace ? `STACK TRACE:\n${request.stackTrace}\n` : ''}

${request.codeContext ? `CODE CONTEXT:\n${request.codeContext}\n` : ''}

${request.filePath ? `FILE PATH: ${request.filePath}\n` : ''}

${request.expectedBehavior ? `EXPECTED BEHAVIOR: ${request.expectedBehavior}\n` : ''}

Please provide a structured analysis with specific fixes.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'moonshotai/kimi-dev-72b:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4096,
        temperature: 0.1, // Low temperature for consistent, focused responses
        top_p: 0.9,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content received from Kimi-Dev-72B');
      }

      // Try to parse as JSON, fallback to structured text parsing
      try {
        return JSON.parse(content);
      } catch {
        return this.parseDebugResponse(content);
      }
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new Error(`Failed to analyze error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze code for potential issues and improvements
   */
  async analyzeCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> {
    if (!this.client) {
      return {
        issues: [{
          type: 'warning' as const,
          message: 'AI code analysis unavailable - API key not configured',
          suggestedFix: 'Configure OPENROUTER_API_KEY environment variable',
          severity: 'low' as const
        }],
        suggestions: ['Set up OpenRouter API key for AI-powered analysis'],
        codeQualityScore: 75
      };
    }
    const systemPrompt = `You are a code analysis expert using Kimi-Dev-72B. Analyze the provided code for:
- ${request.analysisType} issues
- Performance optimizations
- Security vulnerabilities
- Best practice violations
- Missing tests or test improvements

Provide a structured JSON response with specific line numbers and actionable suggestions.`;

    const userPrompt = `Analyze this ${request.analysisType} in file "${request.filePath}":

\`\`\`
${request.code}
\`\`\`

Provide detailed analysis with line numbers, severity levels, and specific fixes.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'moonshotai/kimi-dev-72b:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3072,
        temperature: 0.2,
        top_p: 0.9,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content received');
      }

      try {
        return JSON.parse(content);
      } catch {
        return this.parseCodeAnalysisResponse(content);
      }
    } catch (error) {
      console.error('Code analysis error:', error);
      throw new Error(`Failed to analyze code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate test cases for code
   */
  async generateTests(code: string, filePath: string, framework: 'jest' | 'vitest' | 'playwright' = 'vitest'): Promise<string> {
    const systemPrompt = `You are a test generation expert. Create comprehensive ${framework} tests for the provided code.
Include:
- Unit tests for all functions/methods
- Edge cases and error scenarios
- Mock setups where needed
- TypeScript types and proper imports

Generate clean, readable, and comprehensive test code.`;

    const userPrompt = `Generate ${framework} tests for this code from "${filePath}":

\`\`\`
${code}
\`\`\`

Create thorough test coverage with proper setup and teardown.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'moonshotai/kimi-dev-72b:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4096,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Test generation error:', error);
      throw new Error(`Failed to generate tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse debug response when JSON parsing fails
   */
  private parseDebugResponse(content: string): DebugAnalysisResponse {
    // Extract key sections using regex patterns
    const analysisMatch = content.match(/(?:analysis|Analysis)[:\s]*([^]*?)(?=(?:root\s*cause|suggested\s*fix|$))/i);
    const rootCauseMatch = content.match(/(?:root\s*cause|Root\s*Cause)[:\s]*([^]*?)(?=(?:suggested\s*fix|prevention|$))/i);
    const fixMatch = content.match(/(?:suggested\s*fix|Solution|Fix)[:\s]*([^]*?)(?=(?:prevention|confidence|$))/i);
    const confidenceMatch = content.match(/(?:confidence|Confidence)[:\s]*(\d+)/i);

    return {
      analysis: analysisMatch?.[1]?.trim() || 'Error analysis not clearly structured',
      rootCause: rootCauseMatch?.[1]?.trim() || 'Root cause not identified',
      suggestedFix: fixMatch?.[1]?.trim() || 'No specific fix provided',
      preventionTips: this.extractBulletPoints(content, /(?:prevention|prevent)/i),
      confidence: confidenceMatch ? parseInt(confidenceMatch[1] || '75') : 75
    };
  }

  /**
   * Parse code analysis response when JSON parsing fails
   */
  private parseCodeAnalysisResponse(content: string): CodeAnalysisResponse {
    return {
      issues: this.extractIssues(content),
      suggestions: this.extractBulletPoints(content, /(?:suggest|recommend)/i),
      codeQualityScore: this.extractQualityScore(content)
    };
  }

  /**
   * Extract bullet points from text
   */
  private extractBulletPoints(text: string, sectionRegex: RegExp): string[] {
    const lines = text.split('\n');
    const relevantSection = lines.find(line => sectionRegex.test(line));
    if (!relevantSection) return [];

    return lines
      .filter(line => line.match(/^[\s]*[-*•]\s*/))
      .map(line => line.replace(/^[\s]*[-*•]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Extract issues from analysis text
   */
  private extractIssues(text: string): CodeAnalysisResponse['issues'] {
    const issuePatterns = [
      /(?:error|issue|problem)[:\s]*([^]*?)(?=\n|$)/gi,
      /(?:warning|concern)[:\s]*([^]*?)(?=\n|$)/gi
    ];

    const issues: CodeAnalysisResponse['issues'] = [];
    
    issuePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          issues.push({
            type: pattern.source.includes('error') ? 'error' : 'warning',
            message: match[1].trim(),
            suggestedFix: 'See analysis for details',
            severity: 'medium'
          });
        }
      }
    });

    return issues.length > 0 ? issues : [{
      type: 'suggestion',
      message: 'No specific issues detected',
      suggestedFix: 'Code appears to follow good practices',
      severity: 'low'
    }];
  }

  /**
   * Extract quality score from analysis
   */
  private extractQualityScore(text: string): number {
    const scoreMatch = text.match(/(?:score|quality|rating)[:\s]*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1] || '80') : 80;
  }

  /**
   * Test the connection to OpenRouter
   */
  async testConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    try {
      const response = await this.client.chat.completions.create({
        model: 'moonshotai/kimi-dev-72b:free',
        messages: [
          { role: 'user', content: 'Hello, are you working?' }
        ],
        max_tokens: 50,
      });

      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('OpenRouter connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();