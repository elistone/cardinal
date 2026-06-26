export interface DailyEnergySummary {
  date: Date;
  generatedKwh: number;
  consumedKwh: number;
  importedKwh: number;
  exportedKwh: number;
}

export interface DailyCostSummary {
  date: Date;
  importCost: number;
  exportEarnings: number;
  savings: number;
  currency: string;
}
