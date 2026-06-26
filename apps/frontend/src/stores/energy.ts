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

export const useEnergyStore = defineStore('energy', () => {
  const snapshot = ref<EnergySnapshot | null>(null)
  const dailySummary = ref<DailySummary | null>(null)
  const dailyFinancials = ref<DailyFinancials | null>(null)
  const health = ref<ConfigurationHealth | null>(null)

  const insight = computed<EnergyInsight | null>(() =>
    snapshot.value ? describeEnergyState(snapshot.value) : null,
  )

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

  return {
    snapshot,
    dailySummary,
    dailyFinancials,
    health,
    insight,
    setSnapshot,
    setDailySummary,
    setDailyFinancials,
    setHealth,
  }
})
