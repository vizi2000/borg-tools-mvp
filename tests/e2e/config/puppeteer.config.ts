import puppeteer from 'puppeteer';
import path from 'path';

export const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3004',
  screenshotDir: path.join(__dirname, '../../../test-report/screenshots'),
  reportDir: path.join(__dirname, '../../../test-report'),
  
  // Puppeteer launch options
  launchOptions: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ],
  },

  // Viewport settings
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  },

  // Timeouts
  timeouts: {
    navigation: 30000,
    interaction: 10000,
    animation: 500,
  },

  // Test data
  testData: {
    githubToken: process.env.TEST_GITHUB_TOKEN || 'test_token_123',
    testUser: {
      username: 'testuser',
      email: 'test@example.com',
    },
  },

  // Selectors
  selectors: {
    // Landing page
    heroSection: '[data-testid="hero-section"]',
    ctaButton: '[data-testid="cta-button"]',
    demoButton: '[data-testid="demo-button"]',
    featuresSection: '[data-testid="features-section"]',
    
    // Auth page
    signInForm: '[data-testid="signin-form"]',
    githubSignInButton: '[data-testid="github-signin"]',
    tokenInput: 'input[name="github-token"]',
    
    // Dashboard
    dashboard: '[data-testid="dashboard"]',
    cvForm: '[data-testid="cv-generation-form"]',
    themeToggle: '[data-testid="theme-toggle"]',
    generateButton: '[data-testid="generate-cv"]',
    
    // Status
    progressBar: '[data-testid="progress-bar"]',
    statusMessage: '[data-testid="status-message"]',
    downloadButton: '[data-testid="download-cv"]',
  },
};

export const ACCESSIBILITY_CONFIG = {
  // WCAG 2.1 AA compliance checks
  colorContrast: {
    normalText: { aa: 4.5, aaa: 7 },
    largeText: { aa: 3, aaa: 4.5 },
  },
  
  focusIndicator: {
    minOutlineWidth: 2,
    minContrastRatio: 3,
  },
  
  interactiveElements: {
    minSize: 44, // pixels
    minSpacing: 8, // pixels
  },
};

export const PERFORMANCE_THRESHOLDS = {
  firstContentfulPaint: 1200, // ms
  largestContentfulPaint: 2500, // ms
  totalBlockingTime: 300, // ms
  cumulativeLayoutShift: 0.1,
  speedIndex: 3400, // ms
};