import { test, expect } from '@playwright/test'

test.describe('CV Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for all tests
    await page.route('/api/v1/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: 'user_123',
          username: 'testuser',
          email: 'test@example.com'
        })
      })
    })

    await page.addInitScript(() => {
      localStorage.setItem('borg_tools_token', 'valid_token')
    })
  })

  test('should initiate CV generation from dashboard', async ({ page }) => {
    // Mock CV generation endpoint
    await page.route('/api/v1/cv/generate', route => {
      route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          job_id: 'job_123',
          status: 'processing',
          estimated_completion: '2025-01-01T00:02:00Z'
        })
      })
    })

    await page.goto('/dashboard')
    
    // Click generate CV button
    const generateButton = page.getByRole('button', { name: /generate cv/i })
    await expect(generateButton).toBeVisible()
    await generateButton.click()
    
    // Should show processing state
    await expect(page.locator('text=Generating your CV')).toBeVisible()
    await expect(page.locator('text=job_123')).toBeVisible()
  })

  test('should track CV generation progress', async ({ page }) => {
    let progressStep = 0

    // Mock CV generation status with progress updates
    await page.route('/api/v1/cv/job_123/status', route => {
      const responses = [
        { status: 'processing', progress: 20, current_step: 'fetching_github_data' },
        { status: 'processing', progress: 50, current_step: 'extracting_data' },
        { status: 'processing', progress: 80, current_step: 'generating_summaries' },
        { 
          status: 'completed', 
          progress: 100, 
          result_url: 'https://storage.supabase.com/cv/123.pdf',
          file_size: 185000
        }
      ]
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responses[Math.min(progressStep++, responses.length - 1)])
      })
    })

    await page.goto('/cv/job_123')
    
    // Should show initial progress
    await expect(page.locator('text=20%')).toBeVisible()
    await expect(page.locator('text=fetching_github_data')).toBeVisible()
    
    // Wait for progress updates
    await page.waitForTimeout(2000)
    await expect(page.locator('text=50%')).toBeVisible()
    
    // Final completion
    await page.waitForTimeout(2000)
    await expect(page.locator('text=completed')).toBeVisible()
    await expect(page.getByRole('button', { name: /download/i })).toBeVisible()
  })

  test('should handle CV generation with custom options', async ({ page }) => {
    // Mock CV generation with options
    await page.route('/api/v1/cv/generate', route => {
      const body = route.request().postDataJSON()
      
      // Verify custom options were sent
      expect(body.max_projects).toBe(3)
      expect(body.target_role).toBe('Senior Software Engineer')
      expect(body.include_private_repos).toBe(false)
      
      route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          job_id: 'job_custom_123',
          status: 'processing'
        })
      })
    })

    await page.goto('/dashboard')
    
    // Open advanced options
    const advancedButton = page.getByRole('button', { name: /advanced options/i })
    await advancedButton.click()
    
    // Set custom options
    await page.fill('input[name="target_role"]', 'Senior Software Engineer')
    await page.fill('input[name="max_projects"]', '3')
    await page.uncheck('input[name="include_private_repos"]')
    
    // Generate CV with options
    const generateButton = page.getByRole('button', { name: /generate cv/i })
    await generateButton.click()
    
    // Should use custom options
    await expect(page.locator('text=job_custom_123')).toBeVisible()
  })

  test('should handle LinkedIn profile integration', async ({ page }) => {
    // Mock CV generation with LinkedIn
    await page.route('/api/v1/cv/generate', route => {
      const body = route.request().postDataJSON()
      
      expect(body.include_linkedin).toBe(true)
      expect(body.linkedin_url).toBe('https://linkedin.com/in/testuser')
      
      route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          job_id: 'job_linkedin_123',
          status: 'processing'
        })
      })
    })

    await page.goto('/dashboard')
    
    // Enable LinkedIn integration
    await page.check('input[name="include_linkedin"]')
    await page.fill('input[name="linkedin_url"]', 'https://linkedin.com/in/testuser')
    
    const generateButton = page.getByRole('button', { name: /generate cv/i })
    await generateButton.click()
    
    await expect(page.locator('text=job_linkedin_123')).toBeVisible()
  })

  test('should download completed CV', async ({ page }) => {
    // Mock CV status as completed
    await page.route('/api/v1/cv/job_123/status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'completed',
          progress: 100,
          result_url: 'https://storage.supabase.com/cv/123.pdf',
          file_size: 185000
        })
      })
    })

    // Mock CV download
    await page.route('/api/v1/cv/job_123/download', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: {
          'content-disposition': 'attachment; filename="testuser_cv.pdf"'
        },
        body: Buffer.from('%PDF-1.4 fake pdf content')
      })
    })

    await page.goto('/cv/job_123')
    
    // Should show download button for completed CV
    const downloadButton = page.getByRole('button', { name: /download/i })
    await expect(downloadButton).toBeVisible()
    
    // Start download
    const downloadPromise = page.waitForDownload()
    await downloadButton.click()
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toBe('testuser_cv.pdf')
  })

  test('should handle CV generation errors', async ({ page }) => {
    // Mock CV generation failure
    await page.route('/api/v1/cv/job_failed_123/status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'failed',
          progress: 30,
          error_message: 'GitHub API rate limit exceeded',
          failed_at: '2025-01-01T00:00:45Z'
        })
      })
    })

    await page.goto('/cv/job_failed_123')
    
    // Should show error state
    await expect(page.locator('text=failed')).toBeVisible()
    await expect(page.locator('text=GitHub API rate limit exceeded')).toBeVisible()
    
    // Should show retry option
    const retryButton = page.getByRole('button', { name: /retry/i })
    await expect(retryButton).toBeVisible()
  })

  test('should handle rate limiting', async ({ page }) => {
    // Mock rate limit response
    await page.route('/api/v1/cv/generate', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Rate limit exceeded. 5 CVs per month allowed for free tier.',
          reset_time: '2025-02-01T00:00:00Z',
          limit: 5,
          remaining: 0
        })
      })
    })

    await page.goto('/dashboard')
    
    const generateButton = page.getByRole('button', { name: /generate cv/i })
    await generateButton.click()
    
    // Should show rate limit message
    await expect(page.locator('text=Rate limit exceeded')).toBeVisible()
    await expect(page.locator('text=5 CVs per month')).toBeVisible()
    
    // Should show upgrade option
    const upgradeButton = page.getByRole('button', { name: /upgrade/i })
    await expect(upgradeButton).toBeVisible()
  })

  test('should display CV generation history', async ({ page }) => {
    // Mock CV history
    await page.route('/api/v1/cv/history', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          history: [
            {
              id: 'job_123',
              status: 'completed',
              created_at: '2025-01-01T00:00:00Z',
              completed_at: '2025-01-01T00:01:30Z',
              result_url: 'https://storage.supabase.com/cv/123.pdf',
              file_size: 185000
            },
            {
              id: 'job_122',
              status: 'failed',
              created_at: '2024-12-31T23:00:00Z',
              error_message: 'GitHub API error'
            },
            {
              id: 'job_121',
              status: 'processing',
              created_at: '2024-12-31T22:00:00Z',
              progress: 65
            }
          ]
        })
      })
    })

    await page.goto('/dashboard')
    
    // Navigate to history
    const historyTab = page.getByRole('tab', { name: /history/i })
    await historyTab.click()
    
    // Should show CV history
    await expect(page.locator('text=job_123')).toBeVisible()
    await expect(page.locator('text=completed')).toBeVisible()
    await expect(page.locator('text=185 KB')).toBeVisible()
    
    await expect(page.locator('text=job_122')).toBeVisible()
    await expect(page.locator('text=failed')).toBeVisible()
    
    await expect(page.locator('text=job_121')).toBeVisible()
    await expect(page.locator('text=processing')).toBeVisible()
    await expect(page.locator('text=65%')).toBeVisible()
  })

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Try to submit with invalid LinkedIn URL
    await page.check('input[name="include_linkedin"]')
    await page.fill('input[name="linkedin_url"]', 'invalid-url')
    
    const generateButton = page.getByRole('button', { name: /generate cv/i })
    await generateButton.click()
    
    // Should show validation error
    await expect(page.locator('text=Invalid LinkedIn URL')).toBeVisible()
    
    // Try with invalid project count
    await page.fill('input[name="max_projects"]', '0')
    await generateButton.click()
    
    await expect(page.locator('text=Project count must be between 1 and 10')).toBeVisible()
  })

  test('should show real-time progress updates', async ({ page }) => {
    let callCount = 0

    // Mock real-time progress updates
    await page.route('/api/v1/cv/job_realtime_123/status', route => {
      const progressSteps = [
        { status: 'processing', progress: 10, current_step: 'initializing' },
        { status: 'processing', progress: 25, current_step: 'fetching_github_data' },
        { status: 'processing', progress: 45, current_step: 'analyzing_repositories' },
        { status: 'processing', progress: 65, current_step: 'extracting_data' },
        { status: 'processing', progress: 85, current_step: 'generating_summaries' },
        { status: 'processing', progress: 95, current_step: 'rendering_pdf' },
        { status: 'completed', progress: 100, result_url: 'https://storage.supabase.com/cv/123.pdf' }
      ]
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(progressSteps[Math.min(callCount++, progressSteps.length - 1)])
      })
    })

    await page.goto('/cv/job_realtime_123')
    
    // Should show initial state
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()
    await expect(page.locator('text=10%')).toBeVisible()
    
    // Wait for automatic updates (polling)
    await page.waitForTimeout(3000)
    await expect(page.locator('text=25%')).toBeVisible()
    await expect(page.locator('text=fetching_github_data')).toBeVisible()
    
    // Continue waiting for completion
    await page.waitForTimeout(5000)
    await expect(page.locator('text=completed')).toBeVisible()
    await expect(page.getByRole('button', { name: /download/i })).toBeVisible()
  })
})