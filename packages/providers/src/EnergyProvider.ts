import type { EnergySnapshot, DailyEnergySummary } from '@cardinal/domain'

export type SnapshotCallback = (snapshot: EnergySnapshot) => void
export type SummaryCallback = (summary: DailyEnergySummary) => void

export interface EnergyProvider {
  onSnapshot(callback: SnapshotCallback): () => void
  onDailySummary(callback: SummaryCallback): () => void
  disconnect(): void
}
