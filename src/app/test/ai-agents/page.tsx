'use client';

import { useState } from 'react';
import { runAIAgentsTests } from '@/lib/ai-agents-test';
import { runOpenRouterTests } from '@/lib/openrouter-test';

export default function AIAgentsTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [openRouterResults, setOpenRouterResults] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [testType, setTestType] = useState<'ai-agents' | 'openrouter'>('openrouter');

  const runTests = async () => {
    setIsRunning(true);
    setResults(null);
    setLogs([]);

    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      setLogs(prev => [...prev, args.join(' ')]);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      setLogs(prev => [...prev, `ERROR: ${args.join(' ')}`]);
      originalError(...args);
    };

    try {
      if (testType === 'openrouter') {
        const testResults = await runOpenRouterTests();
        setOpenRouterResults(testResults);
      } else {
        const testResults = await runAIAgentsTests();
        setResults(testResults);
      }
    } catch (error) {
      if (testType === 'openrouter') {
        setOpenRouterResults({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } else {
        setResults({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } finally {
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">AI Agents Integration Test</h1>
          <p className="text-gray-300 mb-6">
            Test the AI-powered CV content generation system with real OpenRouter models or mock data.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Test Type:</label>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="openrouter"
                  checked={testType === 'openrouter'}
                  onChange={(e) => setTestType(e.target.value as 'openrouter')}
                  className="mr-2"
                />
                OpenRouter Integration (Real AI)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="ai-agents"
                  checked={testType === 'ai-agents'}
                  onChange={(e) => setTestType(e.target.value as 'ai-agents')}
                  className="mr-2"
                />
                Mock AI Agents
              </label>
            </div>
          </div>
          
          <button
            onClick={runTests}
            disabled={isRunning}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {isRunning ? 'Running Tests...' : `Run ${testType === 'openrouter' ? 'OpenRouter' : 'Mock AI'} Tests`}
          </button>
        </div>

        {/* OpenRouter Test Results */}
        {openRouterResults && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">OpenRouter Test Results</h2>
            <div className={`p-4 rounded-lg ${openRouterResults.success ? 'bg-green-900 border border-green-500' : 'bg-red-900 border border-red-500'}`}>
              <div className="flex items-center mb-2">
                <span className={`text-2xl mr-2 ${openRouterResults.success ? 'text-green-400' : 'text-red-400'}`}>
                  {openRouterResults.success ? '✅' : '❌'}
                </span>
                <span className="font-semibold">
                  {openRouterResults.success ? 'All OpenRouter Tests Passed' : 'OpenRouter Tests Failed'}
                </span>
              </div>
              
              {openRouterResults.error && (
                <p className="text-red-300 mt-2">Error: {openRouterResults.error}</p>
              )}
              
              {openRouterResults.summary && (
                <div className="mt-4 space-y-2">
                  <p><span className="text-blue-400">Connection:</span> {openRouterResults.summary.connectionWorking ? '✅ Working' : '❌ Failed'}</p>
                  <p><span className="text-blue-400">Working Models:</span> {openRouterResults.summary.workingModels}/{openRouterResults.summary.totalModels}</p>
                  <p><span className="text-blue-400">CV Generation:</span> {openRouterResults.summary.cvGenerationWorking ? '✅ Working' : '❌ Failed'}</p>
                  {openRouterResults.summary.recommendedModel && (
                    <p><span className="text-blue-400">Recommended Model:</span> {openRouterResults.summary.recommendedModel}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mock AI Test Results */}
        {results && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Test Results</h2>
            <div className={`p-4 rounded-lg ${results.success ? 'bg-green-900 border border-green-500' : 'bg-red-900 border border-red-500'}`}>
              <div className="flex items-center mb-2">
                <span className={`text-2xl mr-2 ${results.success ? 'text-green-400' : 'text-red-400'}`}>
                  {results.success ? '✅' : '❌'}
                </span>
                <span className="font-semibold">
                  {results.success ? 'All Tests Passed' : 'Tests Failed'}
                </span>
              </div>
              
              {results.error && (
                <p className="text-red-300 mt-2">Error: {results.error}</p>
              )}
              
              {results.results && (
                <div className="mt-4 space-y-4">
                  {/* Functionality Test Results */}
                  {results.results.functionality && (
                    <div className="bg-gray-800 p-4 rounded">
                      <h3 className="font-semibold mb-2">Functionality Test</h3>
                      {results.results.functionality.cvContent && (
                        <div className="text-sm space-y-2">
                          <p><span className="text-green-400">Professional Summary:</span> {results.results.functionality.cvContent.professionalSummary.slice(0, 100)}...</p>
                          <p><span className="text-blue-400">Skills:</span> {results.results.functionality.cvContent.technicalSkills.programming.slice(0, 3).join(', ')}</p>
                          <p><span className="text-purple-400">Projects:</span> {results.results.functionality.cvContent.projects.length} showcase projects</p>
                          <p><span className="text-yellow-400">Quality Score:</span> {results.results.functionality.contentScore?.overall}%</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Performance Test Results */}
                  {results.results.performance?.performance && (
                    <div className="bg-gray-800 p-4 rounded">
                      <h3 className="font-semibold mb-2">Performance Test</h3>
                      <div className="text-sm space-y-1">
                        <p><span className="text-cyan-400">Total Time:</span> {results.results.performance.performance.totalTime}ms</p>
                        <p><span className="text-cyan-400">Avg Per Agent:</span> {results.results.performance.performance.avgPerAgent}ms</p>
                        <p><span className="text-cyan-400">Throughput:</span> {results.results.performance.performance.throughput}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Console Logs */}
        {logs.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Console Output</h2>
            <div className="bg-black p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className={`mb-1 ${log.startsWith('ERROR:') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : log.includes('🤖') ? 'text-blue-400' : 'text-gray-300'}`}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-3">How It Works</h2>
          <div className="space-y-2 text-gray-300">
            <p>• <strong>Mock Data:</strong> Creates realistic GitHub profile data for testing</p>
            <p>• <strong>AI Agents:</strong> Runs 5 specialized agents (Summary, Experience, Projects, Skills, ATS)</p>
            <p>• <strong>Content Generation:</strong> Produces structured CV content with AI-generated descriptions</p>
            <p>• <strong>Quality Scoring:</strong> Evaluates the generated content quality</p>
            <p>• <strong>Performance:</strong> Measures execution time and throughput</p>
          </div>
        </div>
      </div>
    </div>
  );
}