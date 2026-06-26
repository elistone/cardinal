import type { EnergySnapshot, EnergyInsight } from '@cardinal/domain'

/**
 * Derives a human-readable EnergyInsight from a live EnergySnapshot.
 *
 * Evaluates the snapshot in priority order — the first matching condition
 * wins. The ordering reflects what a homeowner cares most about seeing.
 */
export function describeEnergyState(snapshot: EnergySnapshot): EnergyInsight {
  const { solar, battery, grid } = snapshot

  if (battery.isCharging && solar.isGenerating && solar.generatingWatts > battery.chargingWatts) {
    return {
      type: 'battery_charging_solar',
      headline: 'Your battery is charging from excess solar.',
      sentiment: 'positive',
    }
  }

  if (battery.isCharging && grid.isImporting) {
    return {
      type: 'battery_charging_grid',
      headline: 'Your battery is charging from the grid.',
      sentiment: 'neutral',
    }
  }

  if (battery.isDischarging && !grid.isImporting) {
    return {
      type: 'battery_discharging',
      headline: 'Your home is running on battery and solar.',
      sentiment: 'positive',
    }
  }

  if (battery.isDischarging && grid.isImporting) {
    return {
      type: 'battery_discharging',
      headline: 'Your battery and the grid are powering your home.',
      sentiment: 'neutral',
    }
  }

  if (solar.isGenerating && grid.isExporting) {
    return {
      type: 'solar_exporting',
      headline: "You're generating more solar than you're using.",
      sentiment: 'positive',
    }
  }

  if (solar.isGenerating && !grid.isImporting) {
    return {
      type: 'solar_covering',
      headline: 'Your home is running entirely on solar.',
      sentiment: 'positive',
    }
  }

  if (solar.isGenerating && grid.isImporting) {
    return {
      type: 'solar_covering',
      headline: "Solar is covering most of your home's power.",
      sentiment: 'positive',
    }
  }

  return {
    type: 'grid_importing',
    headline: 'Your home is running on grid power.',
    sentiment: 'neutral',
  }
}
