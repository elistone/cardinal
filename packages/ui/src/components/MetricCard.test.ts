import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import MetricCard from './MetricCard.vue'

const defaults = {
  label: 'Solar output',
  value: 800,
  unit: 'W',
  concept: 'solar' as const,
}

describe('MetricCard', () => {
  describe('value formatting', () => {
    it('renders a watt value below 1000 without unit conversion', () => {
      render(MetricCard, { props: { ...defaults, value: 850 } })
      expect(screen.getByText('850')).toBeDefined()
      expect(screen.getByText('W')).toBeDefined()
    })

    it('converts values >= 1000 W to kW', () => {
      render(MetricCard, { props: { ...defaults, value: 3600 } })
      expect(screen.getByText('3.6')).toBeDefined()
      expect(screen.getByText('kW')).toBeDefined()
    })

    it('renders an em-dash when value is null (sensor unavailable)', () => {
      render(MetricCard, { props: { ...defaults, value: null } })
      expect(screen.getByText('—')).toBeDefined()
    })

    it('does not render a unit when value is null', () => {
      render(MetricCard, { props: { ...defaults, value: null } })
      expect(screen.queryByText('W')).toBeNull()
    })
  })

  describe('label and direction', () => {
    it('renders the label', () => {
      render(MetricCard, { props: defaults })
      expect(screen.getByText('Solar output')).toBeDefined()
    })

    it('renders the direction label when provided', () => {
      render(MetricCard, {
        props: { ...defaults, directionLabel: '68% · Charging' },
      })
      expect(screen.getByText('68% · Charging')).toBeDefined()
    })

    it('does not render direction when omitted', () => {
      render(MetricCard, { props: defaults })
      expect(screen.queryByText('Charging')).toBeNull()
    })
  })

  describe('loading state', () => {
    it('does not show value or label while loading', () => {
      render(MetricCard, { props: { ...defaults, isLoading: true } })
      expect(screen.queryByText('800')).toBeNull()
      expect(screen.queryByText('Solar output')).toBeNull()
    })
  })
})
