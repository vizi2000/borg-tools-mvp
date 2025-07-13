import { TestHelper, TestContext } from './utils/test-helpers';
import { TEST_CONFIG } from './config/puppeteer.config';
import { generateHTMLReport } from './utils/report-generator';

const testHelper = new TestHelper();

async function runSimpleTest() {
  console.log('🚀 Starting simple E2E test suite...\n');
  
  const context = await testHelper.setupTest('simple-test');
  
  try {
    // Test 1: Landing Page Basic Tests
    await testLandingPageBasic(context);
    
    // Test 2: Basic Navigation
    await testBasicNavigation(context);
    
    // Test 3: Visual Tests
    await testVisualElements(context);
    
    // Test 4: Basic Accessibility
    await testBasicAccessibility(context);
    
    // Generate report
    await generateHTMLReport(context);
    
    console.log('\n✅ Test suite completed!');
    console.log(`📊 Found ${context.bugs.length} bugs`);
    console.log(`📸 Captured ${context.screenshots.length} screenshots`);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    await testHelper.takeScreenshot(context, 'test-failure');
  } finally {
    await testHelper.cleanup(context);
  }
}

async function testLandingPageBasic(context: TestContext) {
  console.log('\n📍 Testing Landing Page Basics...');
  
  // Navigate to landing page
  await context.page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
  await testHelper.takeScreenshot(context, 'landing-page-initial');
  
  // Check page title
  const title = await context.page.title();
  if (!title.includes('Borg-Tools')) {
    await testHelper.reportBug(context, {
      severity: 'low',
      type: 'SEO',
      description: 'Page title does not contain brand name',
      steps: ['Navigated to landing page', 'Checked page title'],
      expectedBehavior: 'Title should contain "Borg-Tools"',
      actualBehavior: `Title is: ${title}`,
      recommendation: 'Update page title to include brand name for better SEO',
    });
  }
  
  // Check for main heading
  const mainHeading = await context.page.$('h1');
  if (!mainHeading) {
    await testHelper.reportBug(context, {
      severity: 'high',
      type: 'Missing Content',
      description: 'No main heading found on landing page',
      element: 'h1',
      steps: ['Navigated to landing page', 'Looked for main heading'],
      expectedBehavior: 'Page should have a main H1 heading',
      actualBehavior: 'No H1 heading found',
      recommendation: 'Add a main heading to improve SEO and accessibility',
    });
  }
  
  // Check for call-to-action buttons
  const buttons = await context.page.$$('button, a[href]');
  if (buttons.length === 0) {
    await testHelper.reportBug(context, {
      severity: 'critical',
      type: 'Missing Navigation',
      description: 'No interactive elements found on landing page',
      steps: ['Scanned page for buttons and links'],
      expectedBehavior: 'Page should have call-to-action buttons or navigation links',
      actualBehavior: 'No buttons or links found',
      recommendation: 'Add clear call-to-action buttons for user engagement',
    });
  }
  
  // Test responsive design at mobile width
  await context.page.setViewport({ width: 375, height: 667 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await testHelper.takeScreenshot(context, 'landing-page-mobile');
  
  // Check if content is still visible
  const bodyHeight = await context.page.evaluate(() => document.body.scrollHeight);
  if (bodyHeight < 400) {
    await testHelper.reportBug(context, {
      severity: 'medium',
      type: 'Responsive Design',
      description: 'Page content appears too short on mobile',
      steps: ['Switched to mobile viewport', 'Measured page height'],
      expectedBehavior: 'Page should have adequate content height on mobile',
      actualBehavior: `Page height is only ${bodyHeight}px`,
      recommendation: 'Ensure mobile layout displays content properly',
    });
  }
  
  // Reset to desktop
  await context.page.setViewport(TEST_CONFIG.viewport);
  
  console.log('✓ Landing page basic tests completed');
}

async function testBasicNavigation(context: TestContext) {
  console.log('\n📍 Testing Basic Navigation...');
  
  // Test internal links
  const links = await context.page.$$eval('a[href]', links => 
    links.map(link => ({
      href: (link as HTMLAnchorElement).href,
      text: (link as HTMLAnchorElement).textContent?.trim() || '',
      isInternal: (link as HTMLAnchorElement).href.includes('localhost')
    }))
  );
  
  const internalLinks = links.filter(link => link.isInternal);
  
  if (internalLinks.length === 0) {
    await testHelper.reportBug(context, {
      severity: 'medium',
      type: 'Navigation',
      description: 'No internal navigation links found',
      steps: ['Scanned page for internal links'],
      expectedBehavior: 'Page should have internal navigation links',
      actualBehavior: 'No internal links found',
      recommendation: 'Add navigation menu or internal links',
    });
  }
  
  // Test first internal link if available
  if (internalLinks.length > 0) {
    const firstLink = internalLinks[0]!;
    try {
      // Find the link by text content using evaluate
      await context.page.evaluate((linkText) => {
        const links = Array.from(document.querySelectorAll('a'));
        const targetLink = links.find(link => link.textContent?.includes(linkText));
        if (targetLink) {
          (targetLink as HTMLElement).click();
        }
      }, firstLink.text);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const currentUrl = context.page.url();
      await testHelper.takeScreenshot(context, 'navigation-test');
      
      if (currentUrl === TEST_CONFIG.baseUrl) {
        await testHelper.reportBug(context, {
          severity: 'medium',
          type: 'Navigation',
          description: 'Navigation link does not change page',
          element: `a[href="${firstLink.href}"]`,
          steps: [`Clicked link: ${firstLink.text}`, 'Checked URL change'],
          expectedBehavior: 'Clicking link should navigate to different page',
          actualBehavior: 'URL remained the same',
          recommendation: 'Verify link targets and routing configuration',
        });
      }
      
      // Go back to home
      await context.page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    } catch (error) {
      await testHelper.reportBug(context, {
        severity: 'high',
        type: 'Navigation Error',
        description: `Failed to navigate using link: ${firstLink.text}`,
        element: `a[href="${firstLink.href}"]`,
        steps: [`Attempted to click link: ${firstLink.text}`],
        expectedBehavior: 'Link should be clickable and functional',
        actualBehavior: `Navigation failed: ${(error as Error).message}`,
        recommendation: 'Fix broken navigation link',
      });
    }
  }
  
  console.log('✓ Basic navigation tests completed');
}

async function testVisualElements(context: TestContext) {
  console.log('\n📍 Testing Visual Elements...');
  
  // Check for images
  const images = await context.page.$$('img');
  let imagesWithoutAlt = 0;
  let brokenImages = 0;
  
  for (const img of images) {
    const alt = await img.evaluate(img => (img as HTMLImageElement).alt);
    const src = await img.evaluate(img => (img as HTMLImageElement).src);
    const naturalHeight = await img.evaluate(img => (img as HTMLImageElement).naturalHeight);
    
    if (!alt) {
      imagesWithoutAlt++;
    }
    
    if (naturalHeight === 0) {
      brokenImages++;
    }
  }
  
  if (imagesWithoutAlt > 0) {
    await testHelper.reportBug(context, {
      severity: 'medium',
      type: 'Accessibility',
      description: `${imagesWithoutAlt} images found without alt text`,
      steps: ['Scanned page for images', 'Checked alt attributes'],
      expectedBehavior: 'All images should have descriptive alt text',
      actualBehavior: `${imagesWithoutAlt} images missing alt text`,
      recommendation: 'Add meaningful alt text to all images',
    });
  }
  
  if (brokenImages > 0) {
    await testHelper.reportBug(context, {
      severity: 'high',
      type: 'Content Error',
      description: `${brokenImages} broken images found`,
      steps: ['Scanned page for images', 'Checked if images loaded'],
      expectedBehavior: 'All images should load successfully',
      actualBehavior: `${brokenImages} images failed to load`,
      recommendation: 'Fix broken image sources',
    });
  }
  
  // Check for proper heading hierarchy
  const headings = await context.page.$$eval('h1, h2, h3, h4, h5, h6', headings =>
    headings.map(h => h.tagName.toLowerCase())
  );
  
  if (headings.length === 0) {
    await testHelper.reportBug(context, {
      severity: 'high',
      type: 'Accessibility',
      description: 'No headings found on page',
      steps: ['Scanned page for heading elements'],
      expectedBehavior: 'Page should have proper heading structure',
      actualBehavior: 'No headings found',
      recommendation: 'Add proper heading hierarchy (H1, H2, etc.)',
    });
  } else {
    const h1Count = headings.filter(h => h === 'h1').length;
    if (h1Count === 0) {
      await testHelper.reportBug(context, {
        severity: 'medium',
        type: 'SEO',
        description: 'Page has no H1 heading',
        steps: ['Checked heading hierarchy'],
        expectedBehavior: 'Page should have exactly one H1 heading',
        actualBehavior: 'No H1 heading found',
        recommendation: 'Add a single H1 heading as the main page title',
      });
    } else if (h1Count > 1) {
      await testHelper.reportBug(context, {
        severity: 'low',
        type: 'SEO',
        description: `Multiple H1 headings found (${h1Count})`,
        steps: ['Checked heading hierarchy'],
        expectedBehavior: 'Page should have exactly one H1 heading',
        actualBehavior: `Found ${h1Count} H1 headings`,
        recommendation: 'Use only one H1 heading per page',
      });
    }
  }
  
  console.log('✓ Visual elements tests completed');
}

async function testBasicAccessibility(context: TestContext) {
  console.log('\n📍 Testing Basic Accessibility...');
  
  // Check for form inputs without labels
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
    await testHelper.reportBug(context, {
      severity: 'high',
      type: 'Accessibility',
      description: `${inputsWithoutLabels} form inputs without labels`,
      steps: ['Scanned form inputs for associated labels'],
      expectedBehavior: 'All form inputs should have labels',
      actualBehavior: `${inputsWithoutLabels} inputs without labels`,
      recommendation: 'Add labels or aria-label attributes to form inputs',
    });
  }
  
  // Check for sufficient color contrast (basic check)
  const contrastIssues = await context.page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    let issues = 0;
    
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      const fg = style.color;
      
      // Very basic check - same color or transparent
      if ((bg === fg && bg !== 'rgba(0, 0, 0, 0)') || 
          (fg === 'rgba(0, 0, 0, 0)' && bg === 'rgba(0, 0, 0, 0)')) {
        issues++;
      }
    });
    
    return issues;
  });
  
  if (contrastIssues > 0) {
    await testHelper.reportBug(context, {
      severity: 'medium',
      type: 'Accessibility',
      description: `${contrastIssues} potential color contrast issues`,
      steps: ['Performed basic color contrast analysis'],
      expectedBehavior: 'Text should have sufficient contrast with background',
      actualBehavior: `${contrastIssues} elements with potential contrast issues`,
      recommendation: 'Review color scheme for WCAG 2.1 AA compliance',
    });
  }
  
  // Check for focus indicators
  const focusableElements = await context.page.$$('button, a, input, select, textarea, [tabindex]');
  
  if (focusableElements.length > 0) {
    // Test focus on first element
    await focusableElements[0]!.focus();
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const hasFocusIndicator = await context.page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused) return false;
      
      const style = window.getComputedStyle(focused);
      return style.outline !== 'none' || 
             style.outlineWidth !== '0px' ||
             style.boxShadow !== 'none';
    });
    
    if (!hasFocusIndicator) {
      await testHelper.reportBug(context, {
        severity: 'high',
        type: 'Accessibility',
        description: 'No visible focus indicators for keyboard navigation',
        steps: ['Focused on interactive element', 'Checked for focus indicator'],
        expectedBehavior: 'Focused elements should have visible indicators',
        actualBehavior: 'No focus indicator visible',
        recommendation: 'Add CSS focus styles for keyboard accessibility',
      });
    }
  }
  
  console.log('✓ Basic accessibility tests completed');
}

// Run the test suite
runSimpleTest().catch(console.error);