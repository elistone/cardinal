import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import { NowPanel } from '@cardinal/ui'
import type { EnergySnapshot, EnergyInsight, ConfigurationHealth } from '@cardinal/domain'

function makeSnapshot(overrides: Partial<EnergySnapshot> = {}): EnergySnapshot {
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
    ...overrides,
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
    detail: 'Battery is at 68% and rising.',
  }
}

describe('NowPanel', () => {
  it('renders the NOW section label', () => {
    render(NowPanel, { props: { snapshot: makeSnapshot(), insight: makeInsight(), health: null } })
    expect(screen.getByText('NOW')).toBeDefined()
  })

  it('renders the insight title', () => {
    render(NowPanel, { props: { snapshot: makeSnapshot(), insight: makeInsight(), health: null } })
    expect(screen.getByText('Charging from Solar')).toBeDefined()
  })

  it('renders the insight description', () => {
    render(NowPanel, { props: { snapshot: makeSnapshot(), insight: makeInsight(), health: null } })
    expect(screen.getByText('Your battery is charging from excess solar.')).toBeDefined()
  })

  it('renders the solar metric label', () => {
    render(NowPanel, { props: { snapshot: makeSnapshot(), insight: makeInsight(), health: null } })
    expect(screen.getByText('Solar output')).toBeDefined()
  })

  it('renders battery direction label including charge percent', () => {
    render(NowPanel, { props: { snapshot: makeSnapshot(), insight: makeInsight(), health: null } })
    expect(screen.getByText('68% · Charging')).toBeDefined()
  })

  it('shows em-dash for an unavailable sensor', () => {
    const unavailableHealth: ConfigurationHealth = {
      live: {
        solar: { status: 'unavailable', entityId: 'sensor.pv_power' },
        batteryCharging: { status: 'configured', entityId: 'sensor.bat_charge' },
        batteryDischarging: { status: 'configured', entityId: 'sensor.bat_discharge' },
        batteryLevel: { status: 'configured', entityId: 'sensor.bat_level' },
        gridImport: { status: 'configured', entityId: 'sensor.grid_import' },
        gridExport: { status: 'configured', entityId: 'sensor.grid_export' },
        homeConsumption: { status: 'configured', entityId: 'sensor.home' },
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
    render(NowPanel, {
      props: { snapshot: makeSnapshot(), insight: makeInsight(), health: unavailableHealth },
    })
    expect(screen.getByText('—')).toBeDefined()
  })

  it('has an accessible main landmark', () => {
    render(NowPanel, { props: { snapshot: makeSnapshot(), insight: makeInsight(), health: null } })
    expect(screen.getByRole('main')).toBeDefined()
  })
})
