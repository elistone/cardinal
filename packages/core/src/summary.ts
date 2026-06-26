import type { EnergySnapshot, StateSummary } from '@cardinal/domain'

export function describeEnergyState(snapshot: EnergySnapshot): StateSummary {
  const { solar, battery, grid, home } = snapshot

  if (battery.isCharging && solar.watts > home.watts) {
    return { headline: 'Your battery is charging from excess solar.' }
  }

  if (battery.isCharging && grid.isImporting) {
    return { headline: 'Your battery is charging from the grid.' }
  }

  if (battery.isDischarging && !grid.isImporting) {
    return { headline: 'Your home is running on battery and solar.' }
  }

  if (battery.isDischarging && grid.isImporting) {
    return { headline: 'Your battery and the grid are powering your home.' }
  }

  if (solar.watts > home.watts && grid.isExporting) {
    return { headline: 'You\'re generating more solar than you\'re using.' }
  }

  if (solar.watts > 0 && !grid.isImporting) {
    return { headline: 'Your home is running entirely on solar.' }
  }

  if (solar.watts > 0 && grid.isImporting) {
    return { headline: 'Solar is covering most of your home\'s power.' }
  }

  return { headline: 'Your home is running on grid power.' }
}
