import type { EnergySnapshot, DailySummary } from '@cardinal/domain'

export type SnapshotCallback = (snapshot: EnergySnapshot) => void
export type DailySummaryCallback = (summary: DailySummary) => void

export interface EnergyProvider {
  onSnapshot(callback: SnapshotCallback): () => void
  onDailySummary(callback: DailySummaryCallback): () => void
  disconnect(): void
}
