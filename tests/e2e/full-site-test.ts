import { TestHelper, TestContext } from './utils/test-helpers';
import { TEST_CONFIG } from './config/puppeteer.config';
import { generateHTMLReport } from './utils/report-generator';

const testHelper = new TestHelper();

async function runFullSiteTest() {
  console.log('🚀 Starting comprehensive E2E test suite...\n');
  
  const context = await testHelper.setupTest('full-site-test');
  
  try {
    // Test 1: Landing Page
    await testLandingPage(context);
    
    // Test 2: Authentication Flow
    await testAuthenticationFlow(context);
    
    // Test 3: Dashboard Functionality
    await testDashboard(context);
    
    // Test 4: CV Generation Process
    await testCVGeneration(context);
    
    // Test 5: Theme Switching
    await testThemeSwitching(context);
    
    // Test 6: Error Handling
    await testErrorHandling(context);
    
    // Test 7: Responsive Design
    await testResponsiveDesign(context);
    
    // Test 8: Performance
    await testPerformance(context);
    
    // Generate report
    await generateHTMLReport(context);
    
    console.log('\n✅ Test suite completed!');
    console.log(`📊 Found ${context.bugs.length} bugs`);
    console.log(`📸 Captured ${context.screenshots.length} screenshots`);
    console.log(`📈 Collected ${context.performanceMetrics.length} performance metrics`);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    await testHelper.takeScreenshot(context, 'test-failure');
  } finally {
    await testHelper.cleanup(context);
  }
}

async function testLandingPage(context: TestContext) {
  console.log('\n📍 Testing Landing Page...');
  
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
  
  // Check hero section
  const heroSection = await testHelper.waitForElement(context.page, TEST_CONFIG.selectors.heroSection);
  if (!heroSection) {
    await testHelper.reportBug(context, {
      severity: 'critical',
      type: 'Missing Content',
      description: 'Hero section not found on landing page',
      element: TEST_CONFIG.selectors.heroSection,
      steps: ['Navigated to landing page', 'Looked for hero section'],
      expectedBehavior: 'Hero section should be prominently displayed',
      actualBehavior: 'Hero section element not found',
      recommendation: 'Ensure hero section is rendered with correct data-testid',
    });
  }
  
  // Test CTA buttons
  const ctaButtonClicked = await testHelper.clickElement(
    context,
    TEST_CONFIG.selectors.ctaButton,
    { screenshot: true, description: 'Main CTA button' }
  );
  
  if (ctaButtonClicked) {
    // Check if navigation occurred
    await new Promise(resolve => setTimeout(resolve, 1000));
    const currentUrl = context.page.url();
    if (!currentUrl.includes('/auth/signin')) {
      await testHelper.reportBug(context, {
        severity: 'high',
        type: 'Navigation Error',
        description: 'CTA button does not navigate to sign-in page',
        element: TEST_CONFIG.selectors.ctaButton,
        steps: ['Clicked CTA button on landing page'],
        expectedBehavior: 'Should navigate to /auth/signin',
        actualBehavior: `Navigated to: ${currentUrl}`,
        recommendation: 'Fix CTA button navigation link',
      });
    }
    await context.page.goBack();
  }
  
  // Test demo button
  const demoButtonClicked = await testHelper.clickElement(
    context,
    TEST_CONFIG.selectors.demoButton,
    { screenshot: true, description: 'Demo button' }
  );
  
  if (demoButtonClicked) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const isDashboard = await testHelper.waitForElement(context.page, TEST_CONFIG.selectors.dashboard);
    if (!isDashboard) {
      await testHelper.reportBug(context, {
        severity: 'high',
        type: 'Feature Error',
        description: 'Demo mode does not lead to dashboard',
        element: TEST_CONFIG.selectors.demoButton,
        steps: ['Clicked demo button on landing page'],
        expectedBehavior: 'Should navigate directly to dashboard in demo mode',
        actualBehavior: 'Dashboard not loaded',
        recommendation: 'Verify demo mode authentication flow',
      });
    }
    await context.page.goto(TEST_CONFIG.baseUrl);
  }
  
  // Check features section
  const featuresSection = await testHelper.waitForElement(context.page, TEST_CONFIG.selectors.featuresSection);
  if (featuresSection) {
    const featureCards = await context.page.$$('[data-testid="feature-card"]');
    if (featureCards.length === 0) {
      await testHelper.reportBug(context, {
        severity: 'medium',
        type: 'Missing Content',
        description: 'No feature cards found in features section',
        element: '[data-testid="feature-card"]',
        steps: ['Scrolled to features section', 'Looked for feature cards'],
        expectedBehavior: 'Should display multiple feature cards',
        actualBehavior: 'No feature cards found',
        recommendation: 'Add feature cards to showcase product capabilities',
      });
    }
  }
  
  // Check accessibility
  await testHelper.checkAccessibility(context);
  
  // Check broken links
  await testHelper.checkBrokenLinks(context);
  
  console.log('✓ Landing page tests completed');
}

async function testAuthenticationFlow(context: TestContext) {
  console.log('\n📍 Testing Authentication Flow...');
  
  // Navigate to sign-in page
  await context.page.goto(`${TEST_CONFIG.baseUrl}/auth/signin`, { waitUntil: 'networkidle2' });
  await testHelper.takeScreenshot(context, 'signin-page');
  
  // Check sign-in form
  const signInForm = await testHelper.waitForElement(context.page, TEST_CONFIG.selectors.signInForm);
  if (!signInForm) {
    await testHelper.reportBug(context, {
      severity: 'critical',
      type: 'Missing Form',
      description: 'Sign-in form not found',
      element: TEST_CONFIG.selectors.signInForm,
      steps: ['Navigated to /auth/signin'],
      expectedBehavior: 'Sign-in form should be displayed',
      actualBehavior: 'Sign-in form not found',
      recommendation: 'Ensure sign-in form is rendered correctly',
    });
    return;
  }
  
  // Test GitHub OAuth button
  const githubButton = await testHelper.waitForElement(context.page, TEST_CONFIG.selectors.githubSignInButton);
  if (!githubButton) {
    await testHelper.reportBug(context, {
      severity: 'critical',
      type: 'Missing Authentication',
      description: 'GitHub sign-in button not found',
      element: TEST_CONFIG.selectors.githubSignInButton,
      steps: ['Looked for GitHub OAuth button'],
      expectedBehavior: 'GitHub sign-in button should be present',
      actualBehavior: 'Button not found',
      recommendation: 'Add GitHub OAuth button to sign-in form',
    });
  }
  
  // Test token input field
  const tokenInput = await testHelper.waitForElement(context.page, TEST_CONFIG.selectors.tokenInput);
  if (tokenInput) {
    // Test empty token submission
    await testHelper.clickElement(context, 'button[type="submit"]', { description: 'Submit empty token' });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const errorMessage = await context.page.$('[data-testid="error-message"]');
    if (!errorMessage) {
      await testHelper.reportBug(context, {
        severity: 'high',
        type: 'Validation Error',
        description: 'No error message shown for empty token submission',
        steps: ['Submitted sign-in form with empty token'],
        expectedBehavior: 'Should show validation error message',
        actualBehavior: 'No error message displayed',
        recommendation: 'Add client-side validation for empty token',
      });
    }
    
    // Test invalid token
    await testHelper.fillInput(context, TEST_CONFIG.selectors.tokenInput, 'invalid_token_123', { clear: true });
    await testHelper.clickElement(context, 'button[type="submit"]', { description: 'Submit invalid token' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test valid token format
    await testHelper.fillInput(context, TEST_CONFIG.selectors.tokenInput, 'github_token_test123', { clear: true });
    await testHelper.clickElement(context, 'button[type="submit"]', { description: 'Submit valid token format' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dashboard = await testHelper.waitForElement(context.page, TEST_CONFIG.selectors.dashboard);
    if (!dashboard) {
      await testHelper.reportBug(context, {
        severity: 'high',
        type: 'Authentication Flow',
        description: 'Valid token format does not redirect to dashboard',
        steps: ['Entered token with valid format', 'Submitted form'],
        expectedBehavior: 'Should redirect to dashboard after authentication',
        actualBehavior: 'Remained on sign-in page',
        recommendation: 'Verify authentication flow and redirect logic',
      });
    }
  }
  
  console.log('✓ Authentication flow tests completed');
}

async function testDashboard(context: TestContext) {
  console.log('\n📍 Testing Dashboard...');
  
  // Use demo mode to access dashboard
  await context.page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
  await testHelper.clickElement(context, TEST_CONFIG.selectors.demoButton);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const dashboard = await testHelper.waitForElement(context.page, TEST_CONFIG.selectors.dashboard);
  if (!dashboard) {
    console.log('⚠️  Could not access dashboard, skipping dashboard tests');
    return;
  }
  
  await testHelper.takeScreenshot(context, 'dashboard-initial');
  
  // Check CV generation form
  const cvForm = await testHelper.waitForElement(context.page, TEST_CONFIG.selectors.cvForm);
  if (!cvForm) {
    await testHelper.reportBug(context, {
      severity: 'critical',
      type: 'Missing Form',
      description: 'CV generation form not found on dashboard',
      element: TEST_CONFIG.selectors.cvForm,
      steps: ['Accessed dashboard in demo mode'],
      expectedBehavior: 'CV generation form should be displayed',
      actualBehavior: 'Form not found',
      recommendation: 'Ensure CV form is rendered on dashboard',
    });
    return;
  }
  
  // Test form fields
  const formFields = [
    { selector: 'input[name="targetRole"]', label: 'Target Role', required: true },
    { selector: 'input[name="maxProjects"]', label: 'Max Projects', required: false },
    { selector: 'input[type="checkbox"][name="includePrivateRepos"]', label: 'Include Private Repos', required: false },
  ];
  
  for (const field of formFields) {
    const element = await testHelper.waitForElement(context.page, field.selector);
    if (!element && field.required) {
      await testHelper.reportBug(context, {
        severity: 'high',
        type: 'Missing Form Field',
        description: `Required field "${field.label}" not found`,
        element: field.selector,
        steps: ['Checked CV generation form fields'],
        expectedBehavior: `${field.label} field should be present`,
        actualBehavior: 'Field not found',
        recommendation: 'Add missing form fields',
      });
    }
  }
  
  // Test user profile display
  const userAvatar = await context.page.$('[data-testid="user-avatar"]');
  const userName = await context.page.$('[data-testid="user-name"]');
  
  if (!userAvatar || !userName) {
    await testHelper.reportBug(context, {
      severity: 'medium',
      type: 'UI/UX',
      description: 'User profile information not displayed on dashboard',
      steps: ['Checked for user profile elements'],
      expectedBehavior: 'User avatar and name should be visible',
      actualBehavior: 'Profile elements missing',
      recommendation: 'Add user profile display to dashboard header',
    });
  }
  
  // Test logout functionality
  const logoutButton = await context.page.$('[data-testid="logout-button"]');
  if (!logoutButton) {
    await testHelper.reportBug(context, {
      severity: 'high',
      type: 'Missing Feature',
      description: 'Logout button not found on dashboard',
      steps: ['Looked for logout button'],
      expectedBehavior: 'Logout button should be accessible',
      actualBehavior: 'No logout button found',
      recommendation: 'Add logout button to dashboard',
    });
  }
  
  console.log('✓ Dashboard tests completed');
}

async function testCVGeneration(context: TestContext) {
  console.log('\n📍 Testing CV Generation...');
  
  // Ensure we're on dashboard
  const dashboard = await testHelper.waitForElement(context.page, TEST_CONFIG.selectors.dashboard);
  if (!dashboard) {
    console.log('⚠️  Not on dashboard, skipping CV generation tests');
    return;
  }
  
  // Fill CV generation form
  await testHelper.fillInput(context, 'input[name="targetRole"]', 'Senior Full Stack Developer', { clear: true });
  await testHelper.fillInput(context, 'input[name="maxProjects"]', '5', { clear: true });
  
  await testHelper.takeScreenshot(context, 'cv-form-filled');
  
  // Submit form
  const generateButton = await testHelper.clickElement(
    context,
    TEST_CONFIG.selectors.generateButton,
    { screenshot: true, description: 'Generate CV button' }
  );
  
  if (!generateButton) {
    return;
  }
  
  // Wait for progress indicator
  await new Promise(resolve => setTimeout(resolve, 2000));
  const progressBar = await testHelper.waitForElement(context.page, TEST_CONFIG.selectors.progressBar, { timeout: 5000 });
  
  if (!progressBar) {
    await testHelper.reportBug(context, {
      severity: 'high',
      type: 'UI Feedback',
      description: 'No progress indicator shown during CV generation',
      element: TEST_CONFIG.selectors.progressBar,
      steps: ['Submitted CV generation form', 'Waited for progress indicator'],
      expectedBehavior: 'Progress bar should appear immediately',
      actualBehavior: 'No progress indicator found',
      recommendation: 'Add loading state and progress indicator',
    });
  } else {
    await testHelper.takeScreenshot(context, 'cv-generation-progress');
    
    // Check progress updates
    let previousProgress = 0;
    let progressUpdates = 0;
    
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const progressValue = await context.page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element ? parseInt(element.getAttribute('aria-valuenow') || '0') : 0;
      }, TEST_CONFIG.selectors.progressBar);
      
      if (progressValue > previousProgress) {
        progressUpdates++;
        previousProgress = progressValue;
      }
      
      if (progressValue === 100) {
        break;
      }
    }
    
    if (progressUpdates < 3) {
      await testHelper.reportBug(context, {
        severity: 'medium',
        type: 'UI Feedback',
        description: 'Progress bar does not update smoothly',
        steps: ['Monitored progress bar during CV generation'],
        expectedBehavior: 'Progress should update incrementally',
        actualBehavior: `Only ${progressUpdates} progress updates observed`,
        recommendation: 'Implement smoother progress updates',
      });
    }
  }
  
  // Check for completion
  const downloadButton = await testHelper.waitForElement(
    context.page,
    TEST_CONFIG.selectors.downloadButton,
    { timeout: 30000 }
  );
  
  if (!downloadButton) {
    await testHelper.reportBug(context, {
      severity: 'critical',
      type: 'Feature Failure',
      description: 'CV generation did not complete successfully',
      steps: ['Submitted CV form', 'Waited for completion'],
      expectedBehavior: 'Download button should appear after generation',
      actualBehavior: 'No download button found after 30 seconds',
      recommendation: 'Debug CV generation pipeline and error handling',
    });
  } else {
    await testHelper.takeScreenshot(context, 'cv-generation-complete');
  }
  
  console.log('✓ CV generation tests completed');
}

async function testThemeSwitching(context: TestContext) {
  console.log('\n📍 Testing Theme Switching...');
  
  // Find theme toggle
  const themeToggle = await testHelper.waitForElement(context.page, TEST_CONFIG.selectors.themeToggle);
  
  if (!themeToggle) {
    await testHelper.reportBug(context, {
      severity: 'medium',
      type: 'Missing Feature',
      description: 'Theme toggle not found',
      element: TEST_CONFIG.selectors.themeToggle,
      steps: ['Looked for theme toggle button'],
      expectedBehavior: 'Theme toggle should be available',
      actualBehavior: 'Theme toggle not found',
      recommendation: 'Ensure theme toggle is visible and accessible',
    });
    return;
  }
  
  // Get initial theme
  const initialTheme = await context.page.evaluate(() => {
    return document.documentElement.getAttribute('data-theme') || 
           document.body.classList.contains('theme-liquid-glass') ? 'liquid-glass' : 'neon-tech';
  });
  
  await testHelper.takeScreenshot(context, `theme-${initialTheme}`);
  
  // Click theme toggle
  await testHelper.clickElement(context, TEST_CONFIG.selectors.themeToggle, { screenshot: true });
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if theme changed
  const newTheme = await context.page.evaluate(() => {
    return document.documentElement.getAttribute('data-theme') || 
           document.body.classList.contains('theme-liquid-glass') ? 'liquid-glass' : 'neon-tech';
  });
  
  if (initialTheme === newTheme) {
    await testHelper.reportBug(context, {
      severity: 'medium',
      type: 'Feature Failure',
      description: 'Theme toggle does not change theme',
      steps: ['Clicked theme toggle button'],
      expectedBehavior: 'Theme should switch between neon-tech and liquid-glass',
      actualBehavior: `Theme remained ${initialTheme}`,
      recommendation: 'Fix theme toggle functionality',
    });
  }
  
  // Check theme persistence
  await context.page.reload();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const persistedTheme = await context.page.evaluate(() => {
    return document.documentElement.getAttribute('data-theme') || 
           document.body.classList.contains('theme-liquid-glass') ? 'liquid-glass' : 'neon-tech';
  });
  
  if (persistedTheme !== newTheme) {
    await testHelper.reportBug(context, {
      severity: 'low',
      type: 'Feature Enhancement',
      description: 'Theme preference not persisted after reload',
      steps: ['Changed theme', 'Reloaded page'],
      expectedBehavior: 'Theme preference should persist',
      actualBehavior: 'Theme reverted to default',
      recommendation: 'Store theme preference in localStorage',
    });
  }
  
  console.log('✓ Theme switching tests completed');
}

async function testErrorHandling(context: TestContext) {
  console.log('\n📍 Testing Error Handling...');
  
  // Test 404 page
  await context.page.goto(`${TEST_CONFIG.baseUrl}/non-existent-page`, { waitUntil: 'networkidle2' });
  await testHelper.takeScreenshot(context, '404-page');
  
  const notFoundMessage = await context.page.$('h1');
  if (!notFoundMessage) {
    await testHelper.reportBug(context, {
      severity: 'medium',
      type: 'Error Handling',
      description: 'No proper 404 page displayed',
      steps: ['Navigated to non-existent page'],
      expectedBehavior: 'Should show custom 404 page',
      actualBehavior: 'Generic or no 404 page shown',
      recommendation: 'Create custom 404 page with navigation options',
    });
  }
  
  // Test API error handling
  await context.page.goto(`${TEST_CONFIG.baseUrl}/auth/signin`, { waitUntil: 'networkidle2' });
  
  // Intercept API calls to simulate errors
  await context.page.setRequestInterception(true);
  context.page.once('request', request => {
    if (request.url().includes('/api/auth/github-token')) {
      request.respond({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    } else {
      request.continue();
    }
  });
  
  await testHelper.fillInput(context, TEST_CONFIG.selectors.tokenInput, 'github_token_test', { clear: true });
  await testHelper.clickElement(context, 'button[type="submit"]');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const errorDisplay = await context.page.$('[data-testid="error-message"]');
  if (!errorDisplay) {
    await testHelper.reportBug(context, {
      severity: 'high',
      type: 'Error Handling',
      description: 'API errors not displayed to user',
      steps: ['Simulated API 500 error', 'Checked for error message'],
      expectedBehavior: 'User-friendly error message should be displayed',
      actualBehavior: 'No error message shown',
      recommendation: 'Implement proper error display for API failures',
    });
  }
  
  await context.page.setRequestInterception(false);
  
  console.log('✓ Error handling tests completed');
}

async function testResponsiveDesign(context: TestContext) {
  console.log('\n📍 Testing Responsive Design...');
  
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ];
  
  for (const viewport of viewports) {
    await context.page.setViewport({ width: viewport.width, height: viewport.height });
    await context.page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await testHelper.takeScreenshot(context, `responsive-${viewport.name}`);
    
    // Check if navigation is accessible
    const navMenu = await context.page.$('[data-testid="nav-menu"]');
    const mobileMenu = await context.page.$('[data-testid="mobile-menu-button"]');
    
    if (viewport.name === 'mobile' && !mobileMenu) {
      await testHelper.reportBug(context, {
        severity: 'high',
        type: 'Responsive Design',
        description: 'Mobile menu button not found on small screens',
        steps: [`Set viewport to ${viewport.width}x${viewport.height}`, 'Looked for mobile menu'],
        expectedBehavior: 'Mobile menu button should be visible',
        actualBehavior: 'Mobile menu button not found',
        recommendation: 'Implement responsive navigation with hamburger menu',
      });
    }
    
    // Check text readability
    const fontSize = await context.page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).fontSize;
    });
    
    if (parseInt(fontSize) < 14) {
      await testHelper.reportBug(context, {
        severity: 'medium',
        type: 'Accessibility',
        description: `Font size too small on ${viewport.name}`,
        steps: [`Set viewport to ${viewport.width}x${viewport.height}`, 'Checked base font size'],
        expectedBehavior: 'Font size should be at least 14px for readability',
        actualBehavior: `Font size is ${fontSize}`,
        recommendation: 'Increase base font size for better readability',
      });
    }
  }
  
  // Reset to desktop viewport
  await context.page.setViewport(TEST_CONFIG.viewport);
  
  console.log('✓ Responsive design tests completed');
}

async function testPerformance(context: TestContext) {
  console.log('\n📍 Testing Performance...');
  
  const pagesToTest = [
    { name: 'Landing Page', url: TEST_CONFIG.baseUrl },
    { name: 'Sign In Page', url: `${TEST_CONFIG.baseUrl}/auth/signin` },
  ];
  
  for (const pageTest of pagesToTest) {
    await context.page.goto(pageTest.url, { waitUntil: 'networkidle2' });
    await testHelper.checkPerformance(context, pageTest.name);
    
    // Check page weight
    const pageMetrics = await context.page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const totalSize = resources.reduce((sum, resource: any) => {
        return sum + (resource.transferSize || 0);
      }, 0);
      return {
        resourceCount: resources.length,
        totalSize: totalSize,
        largestResource: Math.max(...resources.map((r: any) => r.transferSize || 0)),
      };
    });
    
    if (pageMetrics.totalSize > 3 * 1024 * 1024) { // 3MB
      await testHelper.reportBug(context, {
        severity: 'medium',
        type: 'Performance',
        description: `${pageTest.name} page size too large`,
        steps: [`Measured page weight for ${pageTest.name}`],
        expectedBehavior: 'Page should be under 3MB',
        actualBehavior: `Page size is ${(pageMetrics.totalSize / 1024 / 1024).toFixed(2)}MB`,
        recommendation: 'Optimize images, minify assets, and implement lazy loading',
      });
    }
    
    // Check for console errors
    const consoleErrors: string[] = [];
    context.page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await context.page.reload();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (consoleErrors.length > 0) {
      await testHelper.reportBug(context, {
        severity: 'medium',
        type: 'JavaScript Errors',
        description: `Console errors on ${pageTest.name}`,
        steps: [`Loaded ${pageTest.name}`, 'Monitored console'],
        expectedBehavior: 'No console errors',
        actualBehavior: `${consoleErrors.length} console errors found`,
        recommendation: 'Fix JavaScript errors: ' + consoleErrors.slice(0, 3).join('; '),
      });
    }
  }
  
  console.log('✓ Performance tests completed');
}

// Run the test suite
runFullSiteTest().catch(console.error);