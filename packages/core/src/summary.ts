import type { EnergySnapshot, EnergyInsight } from '@cardinal/domain'

/**
 * Derives a structured EnergyInsight from a live EnergySnapshot.
 *
 * Evaluates the snapshot in priority order — the first matching condition wins.
 * The ordering reflects what a homeowner most wants to understand first:
 * battery behaviour, then solar self-sufficiency, then grid dependency.
 *
 * All insights generated here carry:
 * - priority: 'normal'   — live state descriptions are informational
 * - confidence: 'high'   — derived directly from sensor data
 * - timestamp            — copied from the source snapshot
 */
export function describeEnergyState(snapshot: EnergySnapshot): EnergyInsight {
  const { solar, battery, grid } = snapshot
  const id = crypto.randomUUID()
  const timestamp = snapshot.timestamp

  if (battery.isCharging && solar.isGenerating && solar.generatingWatts > battery.chargingWatts) {
    return {
      id,
      type: 'battery_charging_solar',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp,
      title: 'Charging from Solar',
      description: 'Your battery is charging from excess solar.',
    }
  }

  if (battery.isCharging && grid.isImporting) {
    return {
      id,
      type: 'battery_charging_grid',
      sentiment: 'neutral',
      priority: 'normal',
      confidence: 'high',
      timestamp,
      title: 'Charging from Grid',
      description: 'Your battery is charging from the grid.',
    }
  }

  if (battery.isDischarging && !grid.isImporting) {
    return {
      id,
      type: 'battery_discharging',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp,
      title: 'Running on Battery',
      description: 'Your home is running on battery and solar.',
    }
  }

  if (battery.isDischarging && grid.isImporting) {
    return {
      id,
      type: 'battery_discharging',
      sentiment: 'neutral',
      priority: 'normal',
      confidence: 'high',
      timestamp,
      title: 'Battery and Grid',
      description: 'Your battery and the grid are powering your home.',
    }
  }

  if (solar.isGenerating && grid.isExporting) {
    return {
      id,
      type: 'solar_exporting',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp,
      title: 'Exporting Solar',
      description: "You're generating more solar than you're using.",
    }
  }

  if (solar.isGenerating && !grid.isImporting) {
    return {
      id,
      type: 'solar_covering',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp,
      title: 'Running on Solar',
      description: 'Your home is running entirely on solar.',
    }
  }

  if (solar.isGenerating && grid.isImporting) {
    return {
      id,
      type: 'solar_covering',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp,
      title: 'Solar Assist',
      description: "Solar is covering most of your home's power.",
    }
  }

  return {
    id,
    type: 'grid_importing',
    sentiment: 'neutral',
    priority: 'normal',
    confidence: 'high',
    timestamp,
    title: 'Grid Power',
    description: 'Your home is running on grid power.',
  }
}
