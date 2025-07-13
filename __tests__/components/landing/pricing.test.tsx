import { render, screen } from '@testing-library/react'
import { Pricing } from '@/components/landing/pricing'

describe('Pricing Component', () => {
  it('renders the pricing section heading', () => {
    render(<Pricing />)
    
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent(/Choose Your Plan/i)
  })

  it('displays all three pricing tiers', () => {
    render(<Pricing />)
    
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  it('shows correct pricing', () => {
    render(<Pricing />)
    
    expect(screen.getByText('$0')).toBeInTheDocument()
    expect(screen.getByText('$5')).toBeInTheDocument()
    expect(screen.getByText('$10')).toBeInTheDocument()
  })

  it('displays pricing periods', () => {
    render(<Pricing />)
    
    const monthlyTexts = screen.getAllByText('/month')
    expect(monthlyTexts).toHaveLength(2) // Pro and Enterprise have monthly pricing
  })

  it('shows feature lists for each tier', () => {
    render(<Pricing />)
    
    // Free tier features
    expect(screen.getByText('1 CV per month')).toBeInTheDocument()
    expect(screen.getByText('Basic GitHub analysis')).toBeInTheDocument()
    
    // Pro tier features
    expect(screen.getByText('5 CVs per month')).toBeInTheDocument()
    expect(screen.getByText('Advanced AI summaries')).toBeInTheDocument()
    
    // Enterprise tier features
    expect(screen.getByText('Unlimited CVs')).toBeInTheDocument()
    expect(screen.getByText('Custom branding')).toBeInTheDocument()
  })

  it('highlights the Pro tier as popular', () => {
    render(<Pricing />)
    
    const popularBadge = screen.getByText('Most Popular')
    expect(popularBadge).toBeInTheDocument()
  })

  it('renders CTA buttons for each tier', () => {
    render(<Pricing />)
    
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
    
    expect(screen.getByText('Get Started')).toBeInTheDocument()
    expect(screen.getByText('Upgrade Now')).toBeInTheDocument()
    expect(screen.getByText('Contact Sales')).toBeInTheDocument()
  })

  it('applies correct styling for popular tier', () => {
    const { container } = render(<Pricing />)
    
    const pricingCards = container.querySelectorAll('[class*="border"]')
    const popularCard = Array.from(pricingCards).find(card => 
      card.textContent?.includes('Most Popular')
    )
    
    expect(popularCard).toHaveClass('border-primary')
  })

  it('has proper accessibility structure', () => {
    render(<Pricing />)
    
    const section = screen.getByRole('region')
    expect(section).toBeInTheDocument()
    
    // Each pricing card should have a heading
    const tierHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(tierHeadings).toHaveLength(3)
  })
})