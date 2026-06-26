import type { EnergySnapshot, EnergyInsight } from '@cardinal/domain'

function formatWatts(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(1)} kW`
  return `${Math.round(watts)} W`
}

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
    const exportClause = grid.isExporting
      ? ` Also sending ${formatWatts(grid.exportingWatts)} to the grid.`
      : ''
    return {
      id,
      type: 'battery_charging_solar',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp,
      title: 'Charging from Solar',
      description: 'Your battery is charging from excess solar.',
      detail: `Battery is at ${battery.chargePercent}% and rising.${exportClause}`,
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
      description: 'Your battery is charging using grid power.',
      detail: `Battery at ${battery.chargePercent}%, charging at ${formatWatts(battery.chargingWatts)}.`,
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
      description: 'Your home is running on battery power. No grid draw.',
      detail: `Battery is at ${battery.chargePercent}% and supplying ${formatWatts(battery.dischargingWatts)}.`,
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
      description: "Battery can't cover all demand — grid is filling the gap.",
      detail: `Battery at ${battery.chargePercent}%, supplying ${formatWatts(battery.dischargingWatts)}.`,
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
      description: "You're generating more solar than you need.",
      detail: `Sending ${formatWatts(grid.exportingWatts)} to the grid.`,
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
      detail: `Generating ${formatWatts(solar.generatingWatts)}.`,
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
      description: 'Solar is reducing your grid draw.',
      detail: `Generating ${formatWatts(solar.generatingWatts)}, importing ${formatWatts(grid.importingWatts)} from the grid.`,
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
    detail: solar.generatingWatts === 0 ? 'No solar generation right now.' : undefined,
  }
}
