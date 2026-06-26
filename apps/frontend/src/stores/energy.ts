import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ConfigurationHealth,
  DailyFinancials,
  DailySummary,
  EnergyInsight,
  EnergySnapshot,
} from '@cardinal/domain'
import { describeEnergyState } from '@cardinal/core'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export const useEnergyStore = defineStore('energy', () => {
  const snapshot = ref<EnergySnapshot | null>(null)
  const dailySummary = ref<DailySummary | null>(null)
  const dailyFinancials = ref<DailyFinancials | null>(null)
  const health = ref<ConfigurationHealth | null>(null)
  const connectionStatus = ref<ConnectionStatus>('connecting')

  const insight = computed<EnergyInsight | null>(() =>
    snapshot.value ? describeEnergyState(snapshot.value) : null,
  )

  /**
   * True when waiting for the first data after mount — no snapshot yet and
   * not explicitly disconnected. Shows skeleton loading states.
   */
  const isLoading = computed(
    () => connectionStatus.value === 'connecting' && snapshot.value === null,
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

  function setSnapshot(incoming: EnergySnapshot): void {
    snapshot.value = incoming
  }

  function setDailySummary(incoming: DailySummary): void {
    dailySummary.value = incoming
  }

  function setDailyFinancials(incoming: DailyFinancials): void {
    dailyFinancials.value = incoming
  }

  function setHealth(incoming: ConfigurationHealth): void {
    health.value = incoming
  }

  function setConnectionStatus(status: ConnectionStatus): void {
    connectionStatus.value = status
  }

  return {
    snapshot,
    dailySummary,
    dailyFinancials,
    health,
    connectionStatus,
    insight,
    isLoading,
    isDisconnected,
    isConfigured,
    setSnapshot,
    setDailySummary,
    setDailyFinancials,
    setHealth,
    setConnectionStatus,
  }
})
