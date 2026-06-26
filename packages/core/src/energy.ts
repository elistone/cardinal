import type { EnergySnapshot, DailyCostSummary } from '@cardinal/domain'

export function calculateDailySavings(
  importedKwh: number,
  exportedKwh: number,
  importRate: number,
  exportRate: number,
  baselineConsumptionKwh: number,
): number {
  const gridOnlyCost = baselineConsumptionKwh * importRate
  const actualCost = importedKwh * importRate - exportedKwh * exportRate
  return gridOnlyCost - actualCost
}

export function calculateImportCost(importedKwh: number, importRate: number): number {
  return importedKwh * importRate
}

export function calculateExportEarnings(exportedKwh: number, exportRate: number): number {
  return exportedKwh * exportRate
}

export function isGeneratingSolar(snapshot: EnergySnapshot): boolean {
  return snapshot.solar.watts > 0
}

export function isSelfSufficient(snapshot: EnergySnapshot): boolean {
  return snapshot.grid.isExporting || (!snapshot.grid.isImporting && snapshot.solar.watts > 0)
}

export function buildDailyCostSummary(
  importedKwh: number,
  exportedKwh: number,
  baselineConsumptionKwh: number,
  importRate: number,
  exportRate: number,
  currency: string,
): DailyCostSummary {
  return {
    date: new Date(),
    importCost: calculateImportCost(importedKwh, importRate),
    exportEarnings: calculateExportEarnings(exportedKwh, exportRate),
    savings: calculateDailySavings(importedKwh, exportedKwh, importRate, exportRate, baselineConsumptionKwh),
    currency,
  }
}
