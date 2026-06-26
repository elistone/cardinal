import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import InsightBlock from './InsightBlock.vue'

const defaults = {
  title: 'Charging from Solar',
  description: 'Your battery is charging from excess solar.',
  sentiment: 'positive' as const,
  confidence: 'high' as const,
}

describe('InsightBlock', () => {
  describe('content rendering', () => {
    it('renders the title', () => {
      render(InsightBlock, { props: defaults })
      expect(screen.getByText('Charging from Solar')).toBeDefined()
    })

    it('renders the description', () => {
      render(InsightBlock, { props: defaults })
      expect(screen.getByText('Your battery is charging from excess solar.')).toBeDefined()
    })

    it('renders the detail text when provided', () => {
      render(InsightBlock, {
        props: { ...defaults, detail: 'Battery is at 68% and rising.' },
      })
      expect(screen.getByText('Battery is at 68% and rising.')).toBeDefined()
    })

    it('does not render detail text when omitted', () => {
      render(InsightBlock, { props: defaults })
      expect(screen.queryByText('Battery is at 68% and rising.')).toBeNull()
    })

    it('shows "Estimated" qualifier when confidence is low', () => {
      render(InsightBlock, { props: { ...defaults, confidence: 'low' as const } })
      expect(screen.getByText('Estimated')).toBeDefined()
    })

    it('does not show qualifier when confidence is high', () => {
      render(InsightBlock, { props: defaults })
      expect(screen.queryByText('Estimated')).toBeNull()
    })
  })

  describe('loading state', () => {
    it('does not show title or description while loading', () => {
      render(InsightBlock, { props: { ...defaults, isLoading: true } })
      expect(screen.queryByText('Charging from Solar')).toBeNull()
      expect(screen.queryByText('Your battery is charging from excess solar.')).toBeNull()
    })
  })

  describe('accessibility', () => {
    it('has aria-label "Energy insight" on the container', () => {
      const { container } = render(InsightBlock, { props: defaults })
      const block = container.querySelector('[aria-label="Energy insight"]')
      expect(block).not.toBeNull()
    })
  })
})
