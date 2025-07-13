import { render, screen } from '@testing-library/react'
import { Hero } from '@/components/landing/hero'

// Mock the GitHub OAuth component
jest.mock('@/components/auth/github-oauth', () => ({
  GitHubOAuth: () => <button data-testid="github-oauth">Sign in with GitHub</button>
}))

describe('Hero Component', () => {
  it('renders the main heading', () => {
    render(<Hero />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent(/One-click CV generator/i)
  })

  it('renders the description text', () => {
    render(<Hero />)
    
    const description = screen.getByText(/GitHub profile into professional PDF/i)
    expect(description).toBeInTheDocument()
  })

  it('displays the GitHub OAuth button', () => {
    render(<Hero />)
    
    const oauthButton = screen.getByTestId('github-oauth')
    expect(oauthButton).toBeInTheDocument()
  })

  it('renders the demo video link', () => {
    render(<Hero />)
    
    const demoLink = screen.getByRole('link', { name: /watch demo/i })
    expect(demoLink).toBeInTheDocument()
    expect(demoLink).toHaveAttribute('href', '#')
  })

  it('displays key features in bullet points', () => {
    render(<Hero />)
    
    expect(screen.getByText(/Single-page PDF/i)).toBeInTheDocument()
    expect(screen.getByText(/ATS-ready format/i)).toBeInTheDocument()
    expect(screen.getByText(/30 seconds generation/i)).toBeInTheDocument()
  })

  it('has proper semantic structure', () => {
    render(<Hero />)
    
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    
    const section = screen.getByRole('region')
    expect(section).toBeInTheDocument()
  })

  it('applies correct CSS classes for theme', () => {
    const { container } = render(<Hero />)
    
    const heroSection = container.querySelector('section')
    expect(heroSection).toHaveClass('bg-background')
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveClass('text-primary')
  })
})