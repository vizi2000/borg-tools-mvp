import puppeteer, { Page, Browser, ElementHandle } from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { TEST_CONFIG } from '../config/puppeteer.config';

export interface TestContext {
  browser: Browser;
  page: Page;
  testName: string;
  bugs: Bug[];
  screenshots: Screenshot[];
  performanceMetrics: PerformanceMetric[];
}

export interface Bug {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  element?: string;
  screenshot?: string;
  timestamp: Date;
  steps: string[];
  expectedBehavior: string;
  actualBehavior: string;
  recommendation: string;
}

export interface Screenshot {
  id: string;
  testName: string;
  stepName: string;
  path: string;
  timestamp: Date;
  annotations?: ScreenshotAnnotation[];
}

export interface ScreenshotAnnotation {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  type: 'error' | 'warning' | 'info';
}

export interface PerformanceMetric {
  page: string;
  metrics: {
    FCP: number;
    LCP: number;
    TBT: number;
    CLS: number;
    SI: number;
  };
  timestamp: Date;
}

export class TestHelper {
  private screenshotCounter = 0;
  
  async setupTest(testName: string): Promise<TestContext> {
    const browser = await puppeteer.launch(TEST_CONFIG.launchOptions);
    const page = await browser.newPage();
    await page.setViewport(TEST_CONFIG.viewport);
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[Browser Console Error] ${msg.text()}`);
      }
    });
    
    // Track page errors
    page.on('pageerror', error => {
      console.error(`[Page Error] ${error.message}`);
    });
    
    // Ensure screenshot directory exists
    await fs.ensureDir(TEST_CONFIG.screenshotDir);
    
    return {
      browser,
      page,
      testName,
      bugs: [],
      screenshots: [],
      performanceMetrics: [],
    };
  }

  async takeScreenshot(
    context: TestContext, 
    stepName: string, 
    annotations?: ScreenshotAnnotation[]
  ): Promise<Screenshot> {
    const screenshotId = `${context.testName}-${this.screenshotCounter++}-${stepName.replace(/\s+/g, '-')}`;
    const screenshotPath = path.join(TEST_CONFIG.screenshotDir, `${screenshotId}.png`);
    
    await context.page.screenshot({ 
      path: screenshotPath as `${string}.png`,
      fullPage: true,
    });
    
    const screenshot: Screenshot = {
      id: screenshotId,
      testName: context.testName,
      stepName,
      path: screenshotPath,
      timestamp: new Date(),
      annotations,
    };
    
    context.screenshots.push(screenshot);
    return screenshot;
  }

  async reportBug(
    context: TestContext,
    bug: Omit<Bug, 'id' | 'timestamp'>
  ): Promise<void> {
    const bugId = `BUG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const screenshotPath = await this.takeScreenshot(context, `bug-${bugId}`);
    
    context.bugs.push({
      ...bug,
      id: bugId,
      timestamp: new Date(),
      screenshot: screenshotPath.path,
    });
  }

  async waitForElement(
    page: Page, 
    selector: string, 
    options?: { timeout?: number; visible?: boolean }
  ): Promise<ElementHandle | null> {
    try {
      await page.waitForSelector(selector, {
        timeout: options?.timeout || TEST_CONFIG.timeouts.interaction,
        visible: options?.visible,
      });
      return await page.$(selector);
    } catch (error) {
      return null;
    }
  }

  async clickElement(
    context: TestContext,
    selector: string,
    options?: { screenshot?: boolean; description?: string }
  ): Promise<boolean> {
    try {
      const element = await this.waitForElement(context.page, selector, { visible: true });
      if (!element) {
        await this.reportBug(context, {
          severity: 'high',
          type: 'Missing Element',
          description: options?.description || `Element not found: ${selector}`,
          element: selector,
          steps: [`Attempted to click element with selector: ${selector}`],
          expectedBehavior: 'Element should be present and clickable',
          actualBehavior: 'Element not found or not visible',
          recommendation: 'Verify the element selector and ensure it is rendered properly',
        });
        return false;
      }
      
      if (options?.screenshot) {
        await this.takeScreenshot(context, `before-click-${selector}`);
      }
      
      await element.click();
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.timeouts.animation));
      
      if (options?.screenshot) {
        await this.takeScreenshot(context, `after-click-${selector}`);
      }
      
      return true;
    } catch (error) {
      await this.reportBug(context, {
        severity: 'medium',
        type: 'Click Failed',
        description: `Failed to click element: ${selector}`,
        element: selector,
        steps: [`Attempted to click element with selector: ${selector}`],
        expectedBehavior: 'Element should be clickable',
        actualBehavior: `Click failed with error: ${(error as Error).message}`,
        recommendation: 'Check if element is disabled or obscured by other elements',
      });
      return false;
    }
  }

  async fillInput(
    context: TestContext,
    selector: string,
    value: string,
    options?: { clear?: boolean; screenshot?: boolean }
  ): Promise<boolean> {
    try {
      const element = await this.waitForElement(context.page, selector, { visible: true });
      if (!element) {
        await this.reportBug(context, {
          severity: 'high',
          type: 'Missing Input',
          description: `Input field not found: ${selector}`,
          element: selector,
          steps: [`Attempted to fill input with selector: ${selector}`],
          expectedBehavior: 'Input field should be present and editable',
          actualBehavior: 'Input field not found or not visible',
          recommendation: 'Verify the input selector and form structure',
        });
        return false;
      }
      
      if (options?.clear) {
        await element.click({ clickCount: 3 });
        await context.page.keyboard.press('Backspace');
      }
      
      await element.type(value);
      
      if (options?.screenshot) {
        await this.takeScreenshot(context, `after-fill-${selector}`);
      }
      
      return true;
    } catch (error) {
      await this.reportBug(context, {
        severity: 'medium',
        type: 'Input Fill Failed',
        description: `Failed to fill input: ${selector}`,
        element: selector,
        steps: [`Attempted to fill input with selector: ${selector}`],
        expectedBehavior: 'Input should accept text',
        actualBehavior: `Fill failed with error: ${(error as Error).message}`,
        recommendation: 'Check if input is disabled or has validation preventing input',
      });
      return false;
    }
  }

  async checkAccessibility(context: TestContext): Promise<void> {
    try {
      // Check for alt text on images
      const imagesWithoutAlt = await context.page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.filter(img => !img.alt).map(img => img.src);
      });
      
      if (imagesWithoutAlt.length > 0) {
        await this.reportBug(context, {
          severity: 'medium',
          type: 'Accessibility',
          description: 'Images found without alt text',
          steps: ['Scanned page for images without alt attributes'],
          expectedBehavior: 'All images should have descriptive alt text',
          actualBehavior: `Found ${imagesWithoutAlt.length} images without alt text`,
          recommendation: 'Add meaningful alt text to all images for screen reader users',
        });
      }
      
      // Check for form labels
      const inputsWithoutLabels = await context.page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        return inputs.filter(input => {
          const id = input.id;
          if (!id) return true;
          const label = document.querySelector(`label[for="${id}"]`);
          return !label && !input.getAttribute('aria-label');
        }).length;
      });
      
      if (inputsWithoutLabels > 0) {
        await this.reportBug(context, {
          severity: 'high',
          type: 'Accessibility',
          description: 'Form inputs found without labels',
          steps: ['Scanned page for form inputs without associated labels'],
          expectedBehavior: 'All form inputs should have associated labels',
          actualBehavior: `Found ${inputsWithoutLabels} inputs without labels`,
          recommendation: 'Add labels or aria-label attributes to all form inputs',
        });
      }
      
      // Check color contrast
      const contrastIssues = await context.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const issues: string[] = [];
        
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const bg = style.backgroundColor;
          const fg = style.color;
          
          // Simple check for very low contrast (would need proper algorithm)
          if (bg === fg && bg !== 'rgba(0, 0, 0, 0)') {
            issues.push(`Element has same foreground and background color`);
          }
        });
        
        return issues;
      });
      
      if (contrastIssues.length > 0) {
        await this.reportBug(context, {
          severity: 'high',
          type: 'Accessibility',
          description: 'Color contrast issues detected',
          steps: ['Analyzed color contrast across page elements'],
          expectedBehavior: 'Text should have sufficient contrast with background',
          actualBehavior: `Found ${contrastIssues.length} potential contrast issues`,
          recommendation: 'Review and fix color contrast to meet WCAG 2.1 AA standards',
        });
      }
    } catch (error) {
      console.error('Accessibility check failed:', error);
    }
  }

  async checkPerformance(context: TestContext, pageName: string): Promise<void> {
    try {
      const metrics = await context.page.metrics();
      const performanceData = await context.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        return {
          FCP: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          LCP: 0, // Would need PerformanceObserver for accurate LCP
          TBT: 0, // Would need more complex calculation
          CLS: 0, // Would need PerformanceObserver
          SI: 0, // Would need more complex calculation
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        };
      });
      
      context.performanceMetrics.push({
        page: pageName,
        metrics: performanceData,
        timestamp: new Date(),
      });
      
      // Check against thresholds
      if (performanceData.FCP > TEST_CONFIG.timeouts.navigation / 3) {
        await this.reportBug(context, {
          severity: 'medium',
          type: 'Performance',
          description: `Slow First Contentful Paint on ${pageName}`,
          steps: [`Measured page performance metrics for ${pageName}`],
          expectedBehavior: `FCP should be under ${TEST_CONFIG.timeouts.navigation / 3}ms`,
          actualBehavior: `FCP was ${performanceData.FCP}ms`,
          recommendation: 'Optimize critical rendering path and reduce render-blocking resources',
        });
      }
    } catch (error) {
      console.error('Performance check failed:', error);
    }
  }

  async checkBrokenLinks(context: TestContext): Promise<void> {
    try {
      const links = await context.page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]')).map(link => ({
          href: (link as HTMLAnchorElement).href,
          text: (link as HTMLAnchorElement).textContent?.trim() || '',
        }));
      });
      
      for (const link of links) {
        if (link.href.startsWith('http') && !link.href.includes('localhost')) {
          try {
            const response = await context.page.evaluate(async (url) => {
              try {
                const res = await fetch(url, { method: 'HEAD' });
                return res.status;
              } catch {
                return 0;
              }
            }, link.href);
            
            if (response === 0 || response >= 400) {
              await this.reportBug(context, {
                severity: 'medium',
                type: 'Broken Link',
                description: `Broken link found: ${link.text}`,
                element: link.href,
                steps: [`Checked link: ${link.href}`],
                expectedBehavior: 'Link should return successful response',
                actualBehavior: `Link returned status ${response}`,
                recommendation: 'Fix or remove broken links',
              });
            }
          } catch (error) {
            // Skip external link checks that fail
          }
        }
      }
    } catch (error) {
      console.error('Link check failed:', error);
    }
  }

  async cleanup(context: TestContext): Promise<void> {
    await context.browser.close();
  }
}