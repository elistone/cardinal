import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import { TodayPanel } from '@cardinal/ui'
import type { DailySummary, DailyFinancials } from '@cardinal/domain'

function makeSummary(overrides: Partial<DailySummary> = {}): DailySummary {
  return {
    date: new Date('2025-06-01'),
    solar:   { generatedKwh: 18.4 },
    battery: { chargedKwh: 8.2, dischargedKwh: 5.1 },
    grid:    { importedKwh: 1.2, exportedKwh: 6.3 },
    home:    { consumedKwh: 12.1 },
    ...overrides,
  }
}

function makeFinancials(): DailyFinancials {
  return {
    date: new Date('2025-06-01'),
    importCost:     0.29,
    exportEarnings: 0.95,
    savings:        2.94,
    currency:       'GBP',
  }
}

describe('TodayPanel', () => {
  it('has an accessible section landmark', () => {
    render(TodayPanel, {
      props: { summary: makeSummary(), financials: null, isLoading: false },
    })
    expect(screen.getByRole('region', { name: 'Today' })).toBeDefined()
  })

  it('renders the solar generated label', () => {
    render(TodayPanel, {
      props: { summary: makeSummary(), financials: null, isLoading: false },
    })
    expect(screen.getByText('Solar generated')).toBeDefined()
  })

  it('renders the home consumed label', () => {
    render(TodayPanel, {
      props: { summary: makeSummary(), financials: null, isLoading: false },
    })
    expect(screen.getByText('Home consumed')).toBeDefined()
  })

  it('renders the grid imported label', () => {
    render(TodayPanel, {
      props: { summary: makeSummary(), financials: null, isLoading: false },
    })
    expect(screen.getByText('Grid imported')).toBeDefined()
  })

  it('renders the grid exported label', () => {
    render(TodayPanel, {
      props: { summary: makeSummary(), financials: null, isLoading: false },
    })
    expect(screen.getByText('Grid exported')).toBeDefined()
  })

  it('renders solar kWh value', () => {
    render(TodayPanel, {
      props: { summary: makeSummary(), financials: null, isLoading: false },
    })
    expect(screen.getByText('18.4')).toBeDefined()
  })

  it('renders the financial summary when financials are provided', () => {
    render(TodayPanel, {
      props: { summary: makeSummary(), financials: makeFinancials(), isLoading: false },
    })
    expect(screen.getByLabelText("Today's financial summary")).toBeDefined()
  })

  it('shows loading skeletons and hides values when isLoading', () => {
    render(TodayPanel, {
      props: { summary: null, financials: null, isLoading: true },
    })
    // Values should not be visible while loading
    expect(screen.queryByText('18.4')).toBeNull()
  })
})
