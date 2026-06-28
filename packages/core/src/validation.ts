import type { EnergySnapshot } from '@cardinal/domain'

export interface SnapshotValidationResult {
  readonly valid: boolean
  readonly warnings: ReadonlyArray<string>
}

/**
 * Validates that a snapshot satisfies Cardinal's invariants.
 *
 * Historical and live snapshots are held to identical standards. Business
 * logic should not branch on the origin of a snapshot — if it passes
 * validation, it is usable.
 *
 * Returns `valid: true` only when no warnings are produced.
 * Warnings are ordered from most to least severe.
 */
export function validateSnapshot(snapshot: EnergySnapshot): SnapshotValidationResult {
  const warnings: string[] = []

  if (!(snapshot.timestamp instanceof Date) || isNaN(snapshot.timestamp.getTime())) {
    warnings.push('snapshot.timestamp is not a valid Date')
  }

  if (!isFiniteNonNegative(snapshot.solar.generatingWatts)) {
    warnings.push('solar.generatingWatts must be a finite non-negative number')
  }

  if (!isFiniteNonNegative(snapshot.battery.chargingWatts)) {
    warnings.push('battery.chargingWatts must be a finite non-negative number')
  }
  if (!isFiniteNonNegative(snapshot.battery.dischargingWatts)) {
    warnings.push('battery.dischargingWatts must be a finite non-negative number')
  }
  if (snapshot.battery.chargePercent < 0 || snapshot.battery.chargePercent > 100 || !isFinite(snapshot.battery.chargePercent)) {
    warnings.push('battery.chargePercent must be in the range 0–100')
  }
  if (snapshot.battery.isCharging && snapshot.battery.isDischarging) {
    warnings.push('battery cannot be simultaneously charging and discharging')
  }

  if (!isFiniteNonNegative(snapshot.grid.importingWatts)) {
    warnings.push('grid.importingWatts must be a finite non-negative number')
  }
  if (!isFiniteNonNegative(snapshot.grid.exportingWatts)) {
    warnings.push('grid.exportingWatts must be a finite non-negative number')
  }
  if (snapshot.grid.isImporting && snapshot.grid.isExporting) {
    warnings.push('grid cannot be simultaneously importing and exporting')
  }

  if (!isFiniteNonNegative(snapshot.home.consumingWatts)) {
    warnings.push('home.consumingWatts must be a finite non-negative number')
  }

  return { valid: warnings.length === 0, warnings }
}

function isFiniteNonNegative(value: number): boolean {
  return typeof value === 'number' && isFinite(value) && value >= 0
}
