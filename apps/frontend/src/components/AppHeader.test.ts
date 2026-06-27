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

function defaultProps(overrides: Partial<{ health: ConfigurationHealth | null; isDisconnected: boolean; showDiagnostics: boolean }> = {}) {
  return { health: null, isDisconnected: false, showDiagnostics: false, ...overrides }
}

describe('AppHeader', () => {
  describe('wordmark', () => {
    it('renders the Cardinal wordmark', () => {
      render(AppHeader, { props: defaultProps() })
      expect(screen.getByText('Cardinal')).toBeDefined()
    })
  })

  describe('health button', () => {
    it('renders the sensor health button when health data is available', () => {
      render(AppHeader, { props: defaultProps({ health: makeHealth('configured') }) })
      const btn = screen.getByLabelText(/Sensor health/)
      expect(btn).toBeDefined()
    })

    it('does not render the sensor health button when health is null', () => {
      render(AppHeader, { props: defaultProps() })
      expect(screen.queryByLabelText(/Sensor health/)).toBeNull()
    })

    it('includes "Sensor health" in the button aria-label', () => {
      render(AppHeader, { props: defaultProps({ health: makeHealth('configured') }) })
      const btn = screen.getByLabelText(/Sensor health/)
      expect(btn.getAttribute('aria-label')).toContain('Sensor health')
    })
  })

  describe('diagnostics button', () => {
    it('always renders the diagnostics button', () => {
      render(AppHeader, { props: defaultProps() })
      expect(screen.getByLabelText('Show diagnostics')).toBeDefined()
    })

    it('reflects active state via aria-pressed and label', () => {
      render(AppHeader, { props: defaultProps({ showDiagnostics: true }) })
      const btn = screen.getByLabelText('Hide diagnostics')
      expect(btn.getAttribute('aria-pressed')).toBe('true')
    })
  })

  describe('disconnected state', () => {
    it('hides the live indicator when disconnected', () => {
      render(AppHeader, { props: defaultProps({ isDisconnected: true }) })
      // LiveIndicator is removed from DOM when disconnected; the StateDisconnected
      // view communicates the reconnecting state at the application level.
      expect(screen.queryByRole('status')).toBeNull()
    })
  })
})
