import type { ConfigurationHealth, DailySummary, EnergySnapshot } from '@cardinal/domain'

export type SnapshotCallback = (snapshot: EnergySnapshot) => void
export type DailySummaryCallback = (summary: DailySummary) => void
export type HealthCallback = (health: ConfigurationHealth) => void
export type ProviderConnectionStatus = 'connected' | 'disconnected'
export type ConnectionStatusCallback = (status: ProviderConnectionStatus) => void

export interface EnergyProvider {
  onSnapshot(callback: SnapshotCallback): () => void
  onDailySummary(callback: DailySummaryCallback): () => void
  onHealth(callback: HealthCallback): () => void
  onConnectionStatus(callback: ConnectionStatusCallback): () => void
  disconnect(): void
}
