import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/')
  })

  test('should display GitHub OAuth button on homepage', async ({ page }) => {
    // Check if the GitHub OAuth button is visible
    const githubButton = page.getByRole('button', { name: /sign in with github/i })
    await expect(githubButton).toBeVisible()
    
    // Check button styling
    await expect(githubButton).toHaveClass(/bg-primary/)
  })

  test('should redirect to GitHub OAuth when clicking sign in', async ({ page }) => {
    // Mock the GitHub OAuth redirect to avoid actual OAuth flow in tests
    await page.route('/api/v1/auth/github/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          auth_url: 'https://github.com/login/oauth/authorize?client_id=test',
          state: 'test_state'
        })
      })
    })

    // Click the GitHub sign in button
    const githubButton = page.getByRole('button', { name: /sign in with github/i })
    await githubButton.click()
    
    // Should initiate OAuth flow (in real implementation)
    // For testing, we verify the API call was made
    await page.waitForResponse('/api/v1/auth/github/login')
  })

  test('should handle OAuth callback success', async ({ page }) => {
    // Mock successful OAuth callback
    await page.route('/api/v1/auth/github/callback*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'test_jwt_token',
          token_type: 'bearer',
          user: {
            id: 'user_123',
            username: 'testuser',
            email: 'test@example.com'
          }
        })
      })
    })

    // Simulate OAuth callback URL
    await page.goto('/auth/callback?code=test_code&state=test_state')
    
    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/\/(dashboard|profile)/)
  })

  test('should handle OAuth callback error', async ({ page }) => {
    // Mock OAuth error
    await page.route('/api/v1/auth/github/callback*', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'The provided authorization grant is invalid'
        })
      })
    })

    // Simulate OAuth callback with error
    await page.goto('/auth/callback?error=access_denied')
    
    // Should show error message
    await expect(page.locator('text=Authentication failed')).toBeVisible()
  })

  test('should persist authentication state', async ({ page, context }) => {
    // Mock authentication
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

    // Simulate being logged in by setting token in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('borg_tools_token', 'test_jwt_token')
    })

    await page.reload()
    
    // Should show authenticated state
    await expect(page.locator('text=testuser')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Mock authentication state
    await page.addInitScript(() => {
      localStorage.setItem('borg_tools_token', 'test_jwt_token')
    })

    // Mock logout endpoint
    await page.route('/api/v1/auth/logout', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Successfully logged out'
        })
      })
    })

    await page.goto('/dashboard')
    
    // Click logout button
    const logoutButton = page.getByRole('button', { name: /logout/i })
    await logoutButton.click()
    
    // Should redirect to home page and clear auth state
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: /sign in with github/i })).toBeVisible()
  })

  test('should handle expired token', async ({ page }) => {
    // Mock expired token response
    await page.route('/api/v1/auth/me', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Token has expired'
        })
      })
    })

    // Set expired token
    await page.addInitScript(() => {
      localStorage.setItem('borg_tools_token', 'expired_token')
    })

    await page.goto('/dashboard')
    
    // Should redirect to login or show login button
    await expect(page.getByRole('button', { name: /sign in with github/i })).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('/api/v1/auth/github/login', route => {
      route.abort('failed')
    })

    const githubButton = page.getByRole('button', { name: /sign in with github/i })
    await githubButton.click()
    
    // Should show error message
    await expect(page.locator('text=Connection error')).toBeVisible()
  })

  test('should validate required OAuth parameters', async ({ page }) => {
    // Test OAuth callback without required parameters
    await page.goto('/auth/callback')
    
    // Should show error for missing parameters
    await expect(page.locator('text=Invalid authentication parameters')).toBeVisible()
  })

  test('should prevent CSRF attacks', async ({ page }) => {
    // Mock OAuth callback with mismatched state
    await page.route('/api/v1/auth/github/callback*', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_state',
          error_description: 'The state parameter is invalid'
        })
      })
    })

    await page.goto('/auth/callback?code=test_code&state=invalid_state')
    
    // Should reject the request
    await expect(page.locator('text=Authentication failed')).toBeVisible()
  })
})

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to home page or show login prompt
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: /sign in with github/i })).toBeVisible()
  })

  test('should allow authenticated users to access dashboard', async ({ page }) => {
    // Mock authentication
    await page.route('/api/v1/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: 'user_123',
          username: 'testuser'
        })
      })
    })

    await page.addInitScript(() => {
      localStorage.setItem('borg_tools_token', 'valid_token')
    })

    await page.goto('/dashboard')
    
    // Should stay on dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle token refresh', async ({ page }) => {
    let tokenExpired = true

    await page.route('/api/v1/auth/me', route => {
      if (tokenExpired) {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Token expired' })
        })
        tokenExpired = false
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user_id: 'user_123',
            username: 'testuser'
          })
        })
      }
    })

    // Mock token refresh
    await page.route('/api/v1/auth/refresh', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'new_token'
        })
      })
    })

    await page.addInitScript(() => {
      localStorage.setItem('borg_tools_token', 'expired_token')
    })

    await page.goto('/dashboard')
    
    // Should automatically refresh token and stay on dashboard
    await expect(page).toHaveURL('/dashboard')
  })
})