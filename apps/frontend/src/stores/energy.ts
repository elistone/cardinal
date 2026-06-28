import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ConfigurationHealth, DailySummary, EnergySnapshot } from '@cardinal/domain'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

/**
 * The live data store.
 *
 * Responsibilities:
 * - Holding the latest snapshot received from the live provider
 * - Holding the latest daily summary received from the live provider
 * - Tracking the WebSocket connection status
 * - Exposing configuration health
 *
 * This store is intentionally thin. It is a data sink for the live provider.
 * All derived state — insight, financials, currentSnapshot — lives in
 * useHistoryStore, which reads from here. Components must not read latestSnapshot
 * directly; they should consume currentSnapshot from useHistoryStore instead.
 */
export const useEnergyStore = defineStore('energy', () => {
  const latestSnapshot = ref<EnergySnapshot | null>(null)
  const latestDailySummary = ref<DailySummary | null>(null)
  const health = ref<ConfigurationHealth | null>(null)
  const connectionStatus = ref<ConnectionStatus>('connecting')

  /**
   * True when waiting for the first data after mount — no snapshot yet and
   * not explicitly disconnected. Shows skeleton loading states.
   */
  const isLoading = computed(
    () => connectionStatus.value === 'connecting' && latestSnapshot.value === null,
  )

  /**
   * True when the WebSocket connection to Home Assistant has been lost.
   * Last-known data may still be held in the store.
   */
  const isDisconnected = computed(() => connectionStatus.value === 'disconnected')

  /**
   * null  = health not yet received (still loading)
   * true  = at least one live sensor is configured
   * false = all live sensors are 'missing' — entity mapping is empty
   */
  const isConfigured = computed<boolean | null>(() => {
    if (!health.value) return null
    return Object.values(health.value.live).some((c) => c.status !== 'missing')
  })

  function setLatestSnapshot(incoming: EnergySnapshot): void {
    latestSnapshot.value = incoming
  }

  function setLatestDailySummary(incoming: DailySummary): void {
    latestDailySummary.value = incoming
  }

  function setHealth(incoming: ConfigurationHealth): void {
    health.value = incoming
  }

  function setConnectionStatus(status: ConnectionStatus): void {
    connectionStatus.value = status
  }

  return {
    latestSnapshot,
    latestDailySummary,
    health,
    connectionStatus,
    isLoading,
    isDisconnected,
    isConfigured,
    setLatestSnapshot,
    setLatestDailySummary,
    setHealth,
    setConnectionStatus,
  }
})
