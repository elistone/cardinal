import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import AppHeader from './AppHeader.vue'
import type { ConfigurationHealth } from '@cardinal/domain'

function makeHealth(status: 'configured' | 'missing' = 'configured'): ConfigurationHealth {
  const sensor = status === 'configured'
    ? { status: 'configured' as const, entityId: 'sensor.pv_power' }
    : { status: 'missing' as const }
  return {
    live: {
      solar: sensor,
      batteryCharging: sensor,
      batteryDischarging: sensor,
      batteryLevel: sensor,
      gridImport: sensor,
      gridExport: sensor,
      homeConsumption: sensor,
    },
    daily: {
      solarGenerated: { status: 'missing' },
      batteryCharged: { status: 'missing' },
      batteryDischarged: { status: 'missing' },
      gridImported: { status: 'missing' },
      gridExported: { status: 'missing' },
      homeConsumed: { status: 'missing' },
    },
  }
}

describe('AppHeader', () => {
  describe('wordmark', () => {
    it('renders the Cardinal wordmark', () => {
      render(AppHeader, { props: { health: null, isDisconnected: false } })
      expect(screen.getByText('Cardinal')).toBeDefined()
    })
  })

  describe('health button', () => {
    it('renders the health button when health data is available', () => {
      render(AppHeader, {
        props: { health: makeHealth('configured'), isDisconnected: false },
      })
      const btn = screen.getByRole('button')
      expect(btn).toBeDefined()
    })

    it('does not render the health button when health is null', () => {
      render(AppHeader, { props: { health: null, isDisconnected: false } })
      expect(screen.queryByRole('button')).toBeNull()
    })

    it('includes "Sensor health" in the button aria-label', () => {
      render(AppHeader, {
        props: { health: makeHealth('configured'), isDisconnected: false },
      })
      const btn = screen.getByRole('button')
      expect(btn.getAttribute('aria-label')).toContain('Sensor health')
    })
  })

  describe('disconnected state', () => {
    it('shows reconnecting badge when disconnected', () => {
      render(AppHeader, { props: { health: null, isDisconnected: true } })
      expect(screen.getByText('Reconnecting…')).toBeDefined()
    })

    it('does not show reconnecting badge when connected', () => {
      render(AppHeader, { props: { health: null, isDisconnected: false } })
      expect(screen.queryByText('Reconnecting…')).toBeNull()
    })
  })
})
