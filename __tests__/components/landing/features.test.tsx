import { render, screen } from '@testing-library/react'
import { Features } from '@/components/landing/features'

describe('Features Component', () => {
  it('renders the features section heading', () => {
    render(<Features />)
    
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent(/Key Features/i)
  })

  it('displays all 6 feature cards', () => {
    render(<Features />)
    
    // Check for specific feature titles
    expect(screen.getByText('GitHub Integration')).toBeInTheDocument()
    expect(screen.getByText('AI-Powered Analysis')).toBeInTheDocument()
    expect(screen.getByText('Professional Design')).toBeInTheDocument()
    expect(screen.getByText('ATS Optimization')).toBeInTheDocument()
    expect(screen.getByText('Instant Generation')).toBeInTheDocument()
    expect(screen.getByText('Secure Storage')).toBeInTheDocument()
  })

  it('displays feature descriptions', () => {
    render(<Features />)
    
    expect(screen.getByText(/OAuth integration with automatic data extraction/i)).toBeInTheDocument()
    expect(screen.getByText(/Claude 3 and GPT-4 analyze your repositories/i)).toBeInTheDocument()
    expect(screen.getByText(/Neon Tech on Black design theme/i)).toBeInTheDocument()
  })

  it('renders feature icons', () => {
    const { container } = render(<Features />)
    
    // Check that SVG icons are present
    const svgElements = container.querySelectorAll('svg')
    expect(svgElements).toHaveLength(6) // One for each feature
  })

  it('has proper grid layout', () => {
    const { container } = render(<Features />)
    
    const featuresGrid = container.querySelector('.grid')
    expect(featuresGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
  })

  it('applies correct theme classes', () => {
    const { container } = render(<Features />)
    
    const featureCards = container.querySelectorAll('[class*="bg-background-card"]')
    expect(featureCards.length).toBeGreaterThan(0)
  })

  it('has accessible structure', () => {
    render(<Features />)
    
    const section = screen.getByRole('region')
    expect(section).toBeInTheDocument()
    
    // Check that each feature has proper heading structure
    const featureHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(featureHeadings).toHaveLength(6)
  })
})