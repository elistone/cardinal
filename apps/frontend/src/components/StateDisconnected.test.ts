import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import StateDisconnected from './StateDisconnected.vue'
import type { EnergySnapshot, EnergyInsight } from '@cardinal/domain'

function makeSnapshot(): EnergySnapshot {
  return {
    timestamp: new Date('2025-06-01T12:00:00Z'),
    solar: { generatingWatts: 3600, isGenerating: true },
    battery: {
      chargePercent: 68,
      chargingWatts: 1800,
      dischargingWatts: 0,
      isCharging: true,
      isDischarging: false,
      isIdle: false,
    },
    grid: {
      importingWatts: 0,
      exportingWatts: 800,
      isImporting: false,
      isExporting: true,
      isIdle: false,
    },
    home: { consumingWatts: 1000 },
    tariffs: { importRate: null, exportRate: null, currency: 'GBP' },
  }
}

function makeInsight(): EnergyInsight {
  return {
    id: 'test',
    type: 'battery_charging_solar',
    sentiment: 'positive',
    priority: 'normal',
    confidence: 'high',
    timestamp: new Date('2025-06-01T12:00:00Z'),
    title: 'Charging from Solar',
    description: 'Your battery is charging from excess solar.',
  }
}

describe('StateDisconnected', () => {
  it('shows the reconnecting banner', () => {
    render(StateDisconnected, { props: { snapshot: null, insight: null } })
    expect(screen.getByText(/Reconnecting/)).toBeDefined()
  })

  it('the reconnecting banner is marked for screen readers', () => {
    const { container } = render(StateDisconnected, { props: { snapshot: null, insight: null } })
    const banner = container.querySelector('[role="status"]')
    expect(banner).not.toBeNull()
  })

  it('shows stale data when snapshot and insight are present', () => {
    render(StateDisconnected, {
      props: { snapshot: makeSnapshot(), insight: makeInsight() },
    })
    expect(screen.getByText('Charging from Solar')).toBeDefined()
  })

  it('shows waiting message when no snapshot exists', () => {
    render(StateDisconnected, { props: { snapshot: null, insight: null } })
    expect(screen.getByText(/Waiting for data/)).toBeDefined()
  })
})
