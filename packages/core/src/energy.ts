import type { DailySummary, DailyFinancials } from '@cardinal/domain'

/**
 * Calculates the cost of electricity imported from the grid.
 *
 * @param importedKwh - Total kWh imported.
 * @param importRate - Price per kWh in the configured currency.
 */
export function calculateImportCost(importedKwh: number, importRate: number): number {
  return importedKwh * importRate
}

/**
 * Calculates earnings from electricity exported to the grid.
 *
 * @param exportedKwh - Total kWh exported.
 * @param exportRate - Export tariff rate per kWh in the configured currency.
 */
export function calculateExportEarnings(exportedKwh: number, exportRate: number): number {
  return exportedKwh * exportRate
}

/**
 * Estimates the saving compared to running the home without solar or battery.
 *
 * Saving = what the electricity bill would have been (all consumption at import
 * rate) minus what was actually paid, plus what was earned from export.
 *
 * @param consumedKwh - Total home consumption in kWh.
 * @param importedKwh - Actual kWh imported from the grid.
 * @param exportedKwh - kWh exported to the grid.
 * @param importRate - Import tariff rate per kWh.
 * @param exportRate - Export tariff rate per kWh.
 */
export function calculateDailySavings(
  consumedKwh: number,
  importedKwh: number,
  exportedKwh: number,
  importRate: number,
  exportRate: number,
): number {
  const baselineCost = consumedKwh * importRate
  const actualCost = importedKwh * importRate - exportedKwh * exportRate
  return baselineCost - actualCost
}

/**
 * Derives DailyFinancials from a DailySummary and configured tariff rates.
 *
 * Returns null when the summary or rates are unavailable, so callers can
 * distinguish "not yet calculated" from a zero result.
 *
 * @param summary - The daily energy summary to derive financials from.
 * @param importRate - Import tariff rate per kWh.
 * @param exportRate - Export tariff rate per kWh.
 * @param currency - ISO 4217 currency code.
 */
export function buildDailyFinancials(
  summary: DailySummary,
  importRate: number,
  exportRate: number,
  currency: string,
): DailyFinancials {
  const importCost = calculateImportCost(summary.grid.importedKwh, importRate)
  const exportEarnings = calculateExportEarnings(summary.grid.exportedKwh, exportRate)
  const savings = calculateDailySavings(
    summary.home.consumedKwh,
    summary.grid.importedKwh,
    summary.grid.exportedKwh,
    importRate,
    exportRate,
  )

  return {
    date: summary.date,
    importCost,
    exportEarnings,
    savings,
    currency,
  }
}
