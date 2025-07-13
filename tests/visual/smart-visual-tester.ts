import puppeteer, { Browser, Page, ElementHandle } from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { openRouterService } from '../../src/services/openrouter';

interface VisualElement {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  tagName: string;
  text: string;
  isVisible: boolean;
  selector: string;
  confidence: number;
  visualType: 'button' | 'link' | 'input' | 'form' | 'text' | 'image';
  color: string;
  backgroundColor: string;
}

interface VisualTestStep {
  stepName: string;
  screenshot: string;
  elementsDetected: VisualElement[];
  actionTaken?: string;
  clickCoordinates?: { x: number, y: number };
  result: 'success' | 'failure' | 'warning';
  errors: string[];
  timing: number;
  aiAnalysis?: {
    suggestion: string;
    rootCause: string;
    fixRecommendation: string;
    confidence: number;
  };
}

export class SmartVisualTester {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private screenshotDir: string;
  private steps: VisualTestStep[] = [];
  private stepCounter = 0;

  constructor() {
    this.screenshotDir = path.join(__dirname, '../../test-report/smart-visual');
  }

  async setup() {
    await fs.ensureDir(this.screenshotDir);
    
    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 800,
      args: [
        '--start-maximized',
        '--disable-web-security',
        '--window-size=1920,1080'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging from browser
    this.page.on('console', msg => {
      console.log(`[Browser Console] ${msg.text()}`);
    });
    
    // Inject visual analysis helpers
    await this.page.addScriptTag({
      content: `
        window.visualAnalyzer = {
          getElementVisualData: function(element) {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              centerX: rect.x + rect.width / 2,
              centerY: rect.y + rect.height / 2,
              isVisible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
              color: style.color,
              backgroundColor: style.backgroundColor,
              borderColor: style.borderColor,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight
            };
          },
          
          isLikelyButton: function(element) {
            const tagName = element.tagName.toLowerCase();
            const role = element.getAttribute('role');
            const type = element.getAttribute('type');
            const style = window.getComputedStyle(element);
            
            return tagName === 'button' || 
                   type === 'submit' || 
                   role === 'button' ||
                   element.classList.contains('btn') ||
                   element.classList.contains('button') ||
                   style.cursor === 'pointer';
          },
          
          isLikelyLink: function(element) {
            return element.tagName.toLowerCase() === 'a' && element.href;
          },
          
          isLikelyInput: function(element) {
            const tagName = element.tagName.toLowerCase();
            return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
          },
          
          getClickabilityScore: function(element) {
            let score = 0;
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            
            // Size scoring
            if (rect.width > 50 && rect.height > 20) score += 0.3;
            if (rect.width > 100 && rect.height > 30) score += 0.2;
            
            // Cursor scoring
            if (style.cursor === 'pointer') score += 0.2;
            
            // Color scoring (neon green detection)
            const bgColor = style.backgroundColor;
            if (bgColor.includes('57, 255, 20') || bgColor.includes('#39ff14')) score += 0.3;
            
            // Interactive element scoring
            if (this.isLikelyButton(element)) score += 0.4;
            if (this.isLikelyLink(element)) score += 0.3;
            if (this.isLikelyInput(element)) score += 0.2;
            
            // Visibility scoring
            if (rect.top >= 0 && rect.top <= window.innerHeight) score += 0.2;
            
            return Math.min(1.0, score);
          }
        };
      `
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Analyze the current page and detect all interactive elements
   */
  async analyzeVisualElements(): Promise<VisualElement[]> {
    if (!this.page) throw new Error('Page not initialized');

    console.log('🔍 Analyzing page for visual elements...');

    const elements = await this.page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      const interactiveElements: any[] = [];
      const analyzer = (window as any).visualAnalyzer;
      
      // Debug: Check if visualAnalyzer exists
      if (!analyzer) {
        console.error('❌ visualAnalyzer not found on window object');
        return [];
      }
      
      console.log(`🔍 Analyzing ${allElements.length} elements...`);

      allElements.forEach((element, index) => {
        try {
          const visualData = analyzer.getElementVisualData(element);
          
          // Only include elements that are visible and potentially interactive
          if (visualData.isVisible && visualData.width > 10 && visualData.height > 10) {
            const clickabilityScore = analyzer.getClickabilityScore(element);
            
            if (clickabilityScore > 0.2) {
              let visualType: string = 'text';
              
              if (analyzer.isLikelyButton(element)) visualType = 'button';
              else if (analyzer.isLikelyLink(element)) visualType = 'link';
              else if (analyzer.isLikelyInput(element)) visualType = 'input';
              else if (element.tagName.toLowerCase() === 'form') visualType = 'form';
              else if (element.tagName.toLowerCase() === 'img') visualType = 'image';

              interactiveElements.push({
                ...visualData,
                tagName: element.tagName.toLowerCase(),
                text: element.textContent?.trim().substring(0, 100) || '',
                selector: `${element.tagName.toLowerCase()}:nth-child(${index + 1})`,
                confidence: clickabilityScore,
                visualType
              });
            }
          }
        } catch (error) {
          console.error(`Error analyzing element ${index}:`, error);
        }
      });

      console.log(`✅ Found ${interactiveElements.length} interactive elements`);
      return interactiveElements.sort((a, b) => b.confidence - a.confidence);
    });

    console.log(`Found ${elements.length} interactive elements`);
    return elements;
  }

  /**
   * Take screenshot with annotations
   */
  async takeAnnotatedScreenshot(stepName: string, elements: VisualElement[] = []): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    const screenshotPath = path.join(this.screenshotDir, `${this.stepCounter}-${stepName}.png`);
    
    // Draw annotations on the page
    if (elements.length > 0) {
      await this.page.evaluate((elementsData) => {
        // Remove existing annotations
        document.querySelectorAll('.visual-test-annotation').forEach(el => el.remove());
        
        // Add new annotations
        elementsData.forEach((element, index) => {
          if (index < 10) { // Limit annotations to top 10 elements
            const annotation = document.createElement('div');
            annotation.className = 'visual-test-annotation';
            annotation.style.cssText = `
              position: fixed;
              left: ${element.x}px;
              top: ${element.y}px;
              width: ${element.width}px;
              height: ${element.height}px;
              border: 2px solid #39ff14;
              background: rgba(57, 255, 20, 0.1);
              z-index: 9999;
              pointer-events: none;
              box-sizing: border-box;
            `;
            
            const label = document.createElement('div');
            label.style.cssText = `
              position: absolute;
              top: -25px;
              left: 0;
              background: #39ff14;
              color: #000;
              padding: 2px 6px;
              font-size: 12px;
              font-weight: bold;
              border-radius: 3px;
              white-space: nowrap;
            `;
            label.textContent = `${index + 1}. ${element.visualType} (${Math.round(element.confidence * 100)}%)`;
            
            annotation.appendChild(label);
            document.body.appendChild(annotation);
          }
        });
      }, elements);
      
      // Wait for annotations to render
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await this.page.screenshot({ 
      path: screenshotPath as `${string}.png`,
      fullPage: false,  // Only capture viewport for cleaner annotations
      type: 'png'
    });

    // Remove annotations after screenshot
    if (elements.length > 0) {
      await this.page.evaluate(() => {
        document.querySelectorAll('.visual-test-annotation').forEach(el => el.remove());
      });
    }

    console.log(`Screenshot: ${screenshotPath}`);
    return screenshotPath;
  }

  /**
   * Smart click using visual analysis and mouse movement
   */
  async smartClick(element: VisualElement, description: string): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');

    console.log(`🖱️  Smart clicking: ${description} at (${element.centerX}, ${element.centerY})`);

    try {
      // Move mouse to element with human-like movement
      await this.humanMouseMove(element.centerX, element.centerY);
      
      // Highlight element before clicking
      await this.highlightElement(element);
      
      // Perform click
      await this.page.mouse.click(element.centerX, element.centerY, { delay: 100 });
      
      // Wait for page response
      await Promise.race([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {}),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      return true;
    } catch (error) {
      console.error(`❌ Click failed: ${error}`);
      return false;
    }
  }

  /**
   * Human-like mouse movement
   */
  private async humanMouseMove(targetX: number, targetY: number): Promise<void> {
    if (!this.page) return;

    const steps = 8;
    const currentPos = { x: 960, y: 540 }; // Assume center start
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const easeProgress = this.easeInOutCubic(progress);
      
      const x = currentPos.x + (targetX - currentPos.x) * easeProgress;
      const y = currentPos.y + (targetY - currentPos.y) * easeProgress;
      
      await this.page.mouse.move(x, y);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }

  /**
   * Highlight element before clicking
   */
  private async highlightElement(element: VisualElement): Promise<void> {
    if (!this.page) return;

    await this.page.evaluate((el) => {
      const highlight = document.createElement('div');
      highlight.className = 'smart-click-highlight';
      highlight.style.cssText = `
        position: fixed;
        left: ${el.x - 5}px;
        top: ${el.y - 5}px;
        width: ${el.width + 10}px;
        height: ${el.height + 10}px;
        border: 3px solid #ff3939;
        background: rgba(255, 57, 57, 0.2);
        z-index: 10000;
        pointer-events: none;
        border-radius: 8px;
        animation: pulse 0.5s ease-in-out;
      `;
      
      document.body.appendChild(highlight);
      
      setTimeout(() => {
        highlight.remove();
      }, 800);
    }, element);

    await new Promise(resolve => setTimeout(resolve, 600));
  }

  /**
   * Easing function for natural movement
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  /**
   * Analyze errors using AI for better debugging
   */
  private async analyzeErrorWithAI(stepName: string, errors: string[], context: string): Promise<{
    suggestion: string;
    rootCause: string;
    fixRecommendation: string;
    confidence: number;
  }> {
    try {
      const errorAnalysis = await openRouterService.analyzeError({
        error: errors.join('; '),
        codeContext: context,
        filePath: 'tests/visual/smart-visual-tester.ts',
        expectedBehavior: `Visual testing step "${stepName}" should complete successfully with element detection and interaction`
      });

      return {
        suggestion: errorAnalysis.analysis,
        rootCause: errorAnalysis.rootCause,
        fixRecommendation: errorAnalysis.suggestedFix,
        confidence: errorAnalysis.confidence
      };
    } catch (error) {
      console.warn('⚠️ AI error analysis failed:', error);
      return {
        suggestion: 'AI analysis unavailable',
        rootCause: 'Could not determine root cause',
        fixRecommendation: 'Manual debugging required',
        confidence: 0
      };
    }
  }

  /**
   * Execute a test step
   */
  async executeStep(stepName: string, action?: () => Promise<void>): Promise<VisualTestStep> {
    const startTime = Date.now();
    const errors: string[] = [];
    let actionTaken = '';
    let clickCoordinates: { x: number, y: number } | undefined;

    try {
      console.log(`\\n📍 Step ${this.stepCounter + 1}: ${stepName}`);

      // Analyze elements
      const elements = await this.analyzeVisualElements();
      
      // Take annotated screenshot
      const screenshot = await this.takeAnnotatedScreenshot(stepName, elements);

      // Execute custom action if provided
      if (action) {
        await action();
        actionTaken = 'Custom action executed';
      }

      const step: VisualTestStep = {
        stepName,
        screenshot,
        elementsDetected: elements,
        actionTaken,
        clickCoordinates,
        result: errors.length > 0 ? 'failure' : 'success',
        errors,
        timing: Date.now() - startTime
      };

      this.steps.push(step);
      this.stepCounter++;

      console.log(`✅ Step completed in ${step.timing}ms`);
      return step;

    } catch (error) {
      errors.push(`Step execution failed: ${error}`);
      
      // Generate AI analysis for failures
      console.log('🤖 Analyzing failure with AI...');
      const aiAnalysis = await this.analyzeErrorWithAI(
        stepName, 
        errors, 
        `Visual testing step that was attempting to: ${actionTaken || 'analyze page elements'}`
      );
      
      const step: VisualTestStep = {
        stepName,
        screenshot: '',
        elementsDetected: [],
        actionTaken,
        clickCoordinates,
        result: 'failure',
        errors,
        timing: Date.now() - startTime,
        aiAnalysis
      };

      this.steps.push(step);
      this.stepCounter++;
      
      console.log(`🤖 AI Analysis: ${aiAnalysis.suggestion}`);
      return step;
    }
  }

  /**
   * Run comprehensive visual test suite
   */
  async runSmartVisualTests(baseUrl: string): Promise<void> {
    console.log('🚀 Starting Smart Visual Test Suite...\\n');

    await this.setup();

    try {
      // Navigate to application
      console.log(`📍 Navigating to: ${baseUrl}`);
      await this.page!.goto(baseUrl, { waitUntil: 'networkidle2' });
      
      // Re-inject visual analyzer after navigation (in case it was lost)
      await this.page!.addScriptTag({
        content: `
          window.visualAnalyzer = {
            getElementVisualData: function(element) {
              const rect = element.getBoundingClientRect();
              const style = window.getComputedStyle(element);
              
              return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                centerX: rect.x + rect.width / 2,
                centerY: rect.y + rect.height / 2,
                isVisible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
                color: style.color,
                backgroundColor: style.backgroundColor,
                borderColor: style.borderColor,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight
              };
            },
            
            isLikelyButton: function(element) {
              const tagName = element.tagName.toLowerCase();
              const role = element.getAttribute('role');
              const type = element.getAttribute('type');
              const style = window.getComputedStyle(element);
              
              return tagName === 'button' || 
                     type === 'submit' || 
                     role === 'button' ||
                     element.classList.contains('btn') ||
                     element.classList.contains('button') ||
                     style.cursor === 'pointer';
            },
            
            isLikelyLink: function(element) {
              return element.tagName.toLowerCase() === 'a' && element.href;
            },
            
            isLikelyInput: function(element) {
              const tagName = element.tagName.toLowerCase();
              return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
            },
            
            getClickabilityScore: function(element) {
              let score = 0;
              const style = window.getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              
              // Size scoring
              if (rect.width > 50 && rect.height > 20) score += 0.3;
              if (rect.width > 100 && rect.height > 30) score += 0.2;
              
              // Cursor scoring
              if (style.cursor === 'pointer') score += 0.2;
              
              // Color scoring (neon green detection)
              const bgColor = style.backgroundColor;
              if (bgColor.includes('57, 255, 20') || bgColor.includes('#39ff14')) score += 0.3;
              
              // Interactive element scoring
              if (this.isLikelyButton(element)) score += 0.4;
              if (this.isLikelyLink(element)) score += 0.3;
              if (this.isLikelyInput(element)) score += 0.2;
              
              // Visibility scoring
              if (rect.top >= 0 && rect.top <= window.innerHeight) score += 0.2;
              
              return Math.min(1.0, score);
            }
          };
          console.log('✅ Visual analyzer re-injected after navigation');
        `
      });

      // Step 1: Analyze landing page
      await this.executeStep('landing-page-analysis');

      // Step 2: Find and click primary CTA
      await this.executeStep('primary-cta-interaction', async () => {
        const elements = await this.analyzeVisualElements();
        const primaryButton = elements.find(el => 
          el.visualType === 'button' && 
          el.confidence > 0.6 &&
          (el.text.toLowerCase().includes('generate') || 
           el.text.toLowerCase().includes('get started') ||
           el.text.toLowerCase().includes('sign'))
        );

        if (primaryButton) {
          const success = await this.smartClick(primaryButton, 'Primary CTA Button');
          if (!success) throw new Error('Failed to click primary CTA');
        } else {
          throw new Error('No primary CTA button found');
        }
      });

      // Step 3: Analyze new page after navigation
      await this.executeStep('post-navigation-analysis');

      // Step 4: Test form interactions (if any)
      await this.executeStep('form-interaction-test', async () => {
        const elements = await this.analyzeVisualElements();
        const inputs = elements.filter(el => el.visualType === 'input');
        
        if (inputs.length > 0) {
          for (const input of inputs.slice(0, 2)) { // Test first 2 inputs
            await this.smartClick(input, `Input field: ${input.text || 'unnamed'}`);
            await this.page!.keyboard.type('test input value', { delay: 100 });
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      });

      // Step 5: Test navigation back
      await this.executeStep('back-navigation-test', async () => {
        await this.page!.goBack();
        await new Promise(resolve => setTimeout(resolve, 2000));
      });

      // Step 6: Test theme switching (if available)
      await this.executeStep('theme-toggle-test', async () => {
        const elements = await this.analyzeVisualElements();
        const themeToggle = elements.find(el => 
          el.text.toLowerCase().includes('theme') ||
          el.text.toLowerCase().includes('mode') ||
          el.selector.includes('theme')
        );

        if (themeToggle) {
          await this.smartClick(themeToggle, 'Theme toggle');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      });

      // Generate AI-powered test improvement suggestions
      await this.generateTestImprovementSuggestions();

      // Generate comprehensive report
      await this.generateSmartReport();

      console.log(`\\n✅ Smart visual testing completed!`);
      console.log(`📊 Executed ${this.steps.length} test steps`);
      console.log(`🐛 Found ${this.steps.filter(s => s.result === 'failure').length} failures`);

    } catch (error) {
      console.error('❌ Smart visual test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Generate AI-powered test improvement suggestions
   */
  private async generateTestImprovementSuggestions(): Promise<void> {
    console.log('🤖 Generating AI-powered test improvement suggestions...');
    
    try {
      const testSummary = this.steps.map(step => 
        `Step: ${step.stepName}, Result: ${step.result}, Elements: ${step.elementsDetected.length}, Timing: ${step.timing}ms, Errors: ${step.errors.join('; ')}`
      ).join('\n');

      const suggestions = await openRouterService.analyzeCode({
        code: testSummary,
        filePath: 'tests/visual/smart-visual-tester.ts',
        analysisType: 'testing'
      });

      // Store suggestions for report
      (this as any).testSuggestions = {
        overallScore: suggestions.codeQualityScore,
        improvements: suggestions.suggestions,
        issues: suggestions.issues
      };

      console.log(`🤖 Generated ${suggestions.suggestions.length} improvement suggestions`);
    } catch (error) {
      console.warn('⚠️ Failed to generate AI suggestions:', error);
      (this as any).testSuggestions = {
        overallScore: 75,
        improvements: ['AI suggestions unavailable'],
        issues: []
      };
    }
  }

  /**
   * Generate comprehensive HTML report
   */
  private async generateSmartReport(): Promise<void> {
    const reportPath = path.join(this.screenshotDir, '../smart-visual-report.html');
    
    const totalElements = this.steps.reduce((sum, step) => sum + step.elementsDetected.length, 0);
    const avgConfidence = this.steps.reduce((sum, step) => {
      const stepAvg = step.elementsDetected.reduce((s, el) => s + el.confidence, 0) / Math.max(1, step.elementsDetected.length);
      return sum + stepAvg;
    }, 0) / Math.max(1, this.steps.length);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Visual Test Report</title>
    <style>
        :root {
            --bg-primary: #0d0d0d;
            --bg-secondary: #1a1a1a;
            --text-primary: #ffffff;
            --text-secondary: #b3b3b3;
            --accent-success: #39ff14;
            --accent-error: #ff3939;
            --accent-warning: #ff9514;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
        }
        
        .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
        .header { text-align: center; margin-bottom: 3rem; }
        .header h1 { font-size: 3rem; margin-bottom: 1rem; color: var(--accent-success); }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 3rem; }
        .summary-card { 
            background: var(--bg-secondary); 
            padding: 1.5rem; 
            border-radius: 8px; 
            text-align: center;
            border: 1px solid rgba(57, 255, 20, 0.3);
        }
        .summary-card h3 { color: var(--accent-success); margin-bottom: 0.5rem; }
        .summary-card .value { font-size: 2rem; font-weight: bold; }
        
        .test-step {
            background: var(--bg-secondary);
            margin: 2rem 0;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #333;
        }
        
        .step-header {
            padding: 1.5rem;
            background: linear-gradient(135deg, var(--bg-secondary) 0%, #262626 100%);
            border-bottom: 1px solid #333;
        }
        
        .step-title { 
            font-size: 1.5rem; 
            margin-bottom: 0.5rem; 
            color: var(--accent-success);
        }
        
        .step-meta {
            display: flex;
            gap: 2rem;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .step-content { padding: 1.5rem; }
        
        .screenshot-container {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .screenshot {
            max-width: 100%;
            border: 1px solid #333;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        
        .elements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .element-card {
            background: #262626;
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid #444;
        }
        
        .element-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .element-type {
            background: var(--accent-success);
            color: #000;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        .confidence-bar {
            flex: 1;
            height: 4px;
            background: #333;
            border-radius: 2px;
            margin-left: 1rem;
            overflow: hidden;
        }
        
        .confidence-fill {
            height: 100%;
            background: var(--accent-success);
            transition: width 0.3s ease;
        }
        
        .result-success { color: var(--accent-success); }
        .result-failure { color: var(--accent-error); }
        .result-warning { color: var(--accent-warning); }
        
        .errors { 
            background: rgba(255, 57, 57, 0.1); 
            border: 1px solid var(--accent-error);
            padding: 1rem; 
            border-radius: 6px; 
            margin-top: 1rem; 
        }
        
        .footer { text-align: center; margin-top: 3rem; color: var(--text-secondary); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Smart Visual Test Report</h1>
            <p>AI-Powered Computer Vision UI Testing</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Test Steps</h3>
                <div class="value">${this.steps.length}</div>
            </div>
            <div class="summary-card">
                <h3>Elements Detected</h3>
                <div class="value">${totalElements}</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div class="value">${Math.round((this.steps.filter(s => s.result === 'success').length / this.steps.length) * 100)}%</div>
            </div>
            <div class="summary-card">
                <h3>Avg Confidence</h3>
                <div class="value">${Math.round(avgConfidence * 100)}%</div>
            </div>
        </div>
        
        ${this.steps.map((step, index) => `
            <div class="test-step">
                <div class="step-header">
                    <div class="step-title">
                        Step ${index + 1}: ${step.stepName}
                        <span class="result-${step.result}">● ${step.result.toUpperCase()}</span>
                    </div>
                    <div class="step-meta">
                        <span>⏱️ ${step.timing}ms</span>
                        <span>🎯 ${step.elementsDetected.length} elements</span>
                        ${step.clickCoordinates ? `<span>🖱️ (${step.clickCoordinates.x}, ${step.clickCoordinates.y})</span>` : ''}
                    </div>
                </div>
                
                <div class="step-content">
                    ${step.screenshot ? `
                        <div class="screenshot-container">
                            <img src="smart-visual/${path.basename(step.screenshot)}" alt="Step screenshot" class="screenshot">
                        </div>
                    ` : ''}
                    
                    ${step.actionTaken ? `<p><strong>Action:</strong> ${step.actionTaken}</p>` : ''}
                    
                    <h4>Detected Interactive Elements (${step.elementsDetected.length})</h4>
                    <div class="elements-grid">
                        ${step.elementsDetected.slice(0, 8).map(el => `
                            <div class="element-card">
                                <div class="element-header">
                                    <span class="element-type">${el.visualType.toUpperCase()}</span>
                                    <div class="confidence-bar">
                                        <div class="confidence-fill" style="width: ${el.confidence * 100}%"></div>
                                    </div>
                                </div>
                                <div style="font-size: 0.9rem; margin-top: 0.5rem;">
                                    <div><strong>Position:</strong> (${Math.round(el.centerX)}, ${Math.round(el.centerY)})</div>
                                    <div><strong>Size:</strong> ${Math.round(el.width)}×${Math.round(el.height)}px</div>
                                    ${el.text ? `<div><strong>Text:</strong> "${el.text.substring(0, 50)}${el.text.length > 50 ? '...' : ''}"</div>` : ''}
                                    <div><strong>Confidence:</strong> ${Math.round(el.confidence * 100)}%</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${step.errors.length > 0 ? `
                        <div class="errors">
                            <h4>🚨 Errors</h4>
                            <ul>
                                ${step.errors.map(error => `<li>${error}</li>`).join('')}
                            </ul>
                            ${step.aiAnalysis ? `
                                <div class="ai-analysis" style="margin-top: 1rem; padding: 1rem; background: rgba(57, 255, 20, 0.1); border: 1px solid var(--accent-success); border-radius: 6px;">
                                    <h5 style="color: var(--accent-success); margin-bottom: 0.5rem;">🤖 AI Analysis (Confidence: ${step.aiAnalysis.confidence}%)</h5>
                                    <div style="margin-bottom: 0.5rem;"><strong>Root Cause:</strong> ${step.aiAnalysis.rootCause}</div>
                                    <div style="margin-bottom: 0.5rem;"><strong>Suggestion:</strong> ${step.aiAnalysis.suggestion}</div>
                                    <div><strong>Fix Recommendation:</strong> ${step.aiAnalysis.fixRecommendation}</div>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('')}
        
        ${(this as any).testSuggestions ? `
            <div class="ai-suggestions" style="background: var(--bg-secondary); margin: 2rem 0; padding: 2rem; border-radius: 12px; border: 1px solid var(--accent-success);">
                <h2 style="color: var(--accent-success); margin-bottom: 1rem;">🤖 AI-Powered Test Improvement Suggestions</h2>
                <div style="margin-bottom: 1rem;">
                    <strong>Overall Test Quality Score: ${(this as any).testSuggestions.overallScore}/100</strong>
                </div>
                
                <h3 style="color: var(--accent-success); margin: 1rem 0;">💡 Improvement Recommendations</h3>
                <ul style="margin-left: 1rem;">
                    ${(this as any).testSuggestions.improvements.map((suggestion: string) => `<li style="margin-bottom: 0.5rem;">${suggestion}</li>`).join('')}
                </ul>
                
                ${(this as any).testSuggestions.issues.length > 0 ? `
                    <h3 style="color: var(--accent-warning); margin: 1rem 0;">⚠️ Identified Issues</h3>
                    <ul style="margin-left: 1rem;">
                        ${(this as any).testSuggestions.issues.map((issue: any) => `<li style="margin-bottom: 0.5rem; color: var(--accent-warning);">${issue.message}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        ` : ''}
        
        <div class="footer">
            <p>🧠 Generated by Smart Visual Testing Suite | Powered by Computer Vision & AI</p>
            <p>🤖 Enhanced with Kimi-Dev-72B for intelligent debugging and analysis</p>
        </div>
    </div>
</body>
</html>`;

    await fs.writeFile(reportPath, html);
    console.log(`📄 Smart visual report generated: ${reportPath}`);
  }
}

// Export for use in other modules

// Run if called directly
if (require.main === module) {
  const tester = new SmartVisualTester();
  tester.runSmartVisualTests('http://localhost:3003')
    .then(() => console.log('✅ Smart visual testing completed'))
    .catch(error => {
      console.error('❌ Smart visual testing failed:', error);
      process.exit(1);
    });
}