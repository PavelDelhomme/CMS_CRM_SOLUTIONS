import { render, screen } from '@testing-library/react'
import PublicFooter from '@/components/PublicFooter'

describe('PublicFooter', () => {
  it('should render CMS_CRM_SOLUTIONS branding', () => {
    render(<PublicFooter />)

    expect(screen.getByText('CMS_CRM_SOLUTIONS')).toBeInTheDocument()
  })

  it('should render product links', () => {
    render(<PublicFooter />)

    expect(screen.getByText('Tarifs')).toBeInTheDocument()
    expect(screen.getByText('Fonctionnalités')).toBeInTheDocument()
    expect(screen.getByText('Templates')).toBeInTheDocument()
  })

  it('should render support links', () => {
    render(<PublicFooter />)

    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
    expect(screen.getByText('FAQ')).toBeInTheDocument()
  })

  it('should render legal links', () => {
    render(<PublicFooter />)

    expect(screen.getByText('CGV')).toBeInTheDocument()
    expect(screen.getByText('Confidentialité')).toBeInTheDocument()
  })

  it('should render copyright', () => {
    render(<PublicFooter />)

    expect(screen.getByText(/2025 CMS_CRM_SOLUTIONS/i)).toBeInTheDocument()
  })
})

