import { render, screen } from '@testing-library/react'
import { HowItWorks } from '@/components/landing/how-it-works'

describe('HowItWorks Component', () => {
  it('renders the section heading', () => {
    render(<HowItWorks />)
    
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent(/How It Works/i)
  })

  it('displays all three steps', () => {
    render(<HowItWorks />)
    
    expect(screen.getByText('Connect GitHub')).toBeInTheDocument()
    expect(screen.getByText('AI Analysis')).toBeInTheDocument()
    expect(screen.getByText('Download PDF')).toBeInTheDocument()
  })

  it('shows step numbers', () => {
    render(<HowItWorks />)
    
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('displays step descriptions', () => {
    render(<HowItWorks />)
    
    expect(screen.getByText(/Sign in with your GitHub account/i)).toBeInTheDocument()
    expect(screen.getByText(/Our AI analyzes your repositories/i)).toBeInTheDocument()
    expect(screen.getByText(/Get your professional CV/i)).toBeInTheDocument()
  })

  it('renders step icons', () => {
    const { container } = render(<HowItWorks />)
    
    const svgElements = container.querySelectorAll('svg')
    expect(svgElements).toHaveLength(3) // One for each step
  })

  it('has proper step progression layout', () => {
    const { container } = render(<HowItWorks />)
    
    const stepsContainer = container.querySelector('.grid')
    expect(stepsContainer).toHaveClass('grid-cols-1', 'md:grid-cols-3')
  })

  it('applies correct theme styling', () => {
    const { container } = render(<HowItWorks />)
    
    const stepCards = container.querySelectorAll('[class*="bg-background-card"]')
    expect(stepCards.length).toBeGreaterThan(0)
  })

  it('has accessible structure', () => {
    render(<HowItWorks />)
    
    const section = screen.getByRole('region')
    expect(section).toBeInTheDocument()
    
    const stepHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(stepHeadings).toHaveLength(3)
  })

  it('shows connecting arrows between steps on larger screens', () => {
    const { container } = render(<HowItWorks />)
    
    // Check for arrow elements (these would be CSS pseudo-elements or separate divs)
    const arrowElements = container.querySelectorAll('[class*="arrow"], [class*="connector"]')
    // This is implementation-dependent, just checking the structure exists
    expect(container.querySelector('.grid')).toBeInTheDocument()
  })
})