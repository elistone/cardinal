import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EnergySnapshot, DailyEnergySummary, StateSummary } from '@cardinal/domain'
import { describeEnergyState } from '@cardinal/core'

export const useEnergyStore = defineStore('energy', () => {
  const snapshot = ref<EnergySnapshot | null>(null)
  const dailySummary = ref<DailyEnergySummary | null>(null)

  const stateSummary = computed<StateSummary | null>(() =>
    snapshot.value ? describeEnergyState(snapshot.value) : null,
  )

  function setSnapshot(incoming: EnergySnapshot): void {
    snapshot.value = incoming
  }

  function setDailySummary(incoming: DailyEnergySummary): void {
    dailySummary.value = incoming
  }

  return { snapshot, dailySummary, stateSummary, setSnapshot, setDailySummary }
})
