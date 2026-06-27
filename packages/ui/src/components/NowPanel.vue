<script setup lang="ts">
import { computed } from 'vue'
import type { EnergySnapshot, EnergyInsight, ConfigurationHealth } from '@cardinal/domain'
import InsightBlock from './InsightBlock.vue'
import MetricCard from './MetricCard.vue'
import EnergyFlowDiagram from './EnergyFlowDiagram.vue'

interface Props {
  snapshot: EnergySnapshot | null
  insight: EnergyInsight | null
  health?: ConfigurationHealth | null
}

const props = defineProps<Props>()

const isLoading = computed(() => !props.snapshot || !props.insight)

const batteryValue = computed(() => {
  const b = props.snapshot?.battery
  if (!b) return 0
  if (b.isCharging) return b.chargingWatts
  if (b.isDischarging) return b.dischargingWatts
  return 0
})

// Direction label: state only — the percentage is already visible in the flow
// diagram node, so showing it here is redundant duplication.
const batteryDirection = computed(() => {
  const b = props.snapshot?.battery
  if (!b) return ''
  if (b.isCharging)    return 'Charging'
  if (b.isDischarging) return 'Discharging'
  return 'Standby'
})

const gridValue = computed(() => {
  const g = props.snapshot?.grid
  if (!g) return 0
  return g.isImporting ? g.importingWatts : g.exportingWatts
})

const gridDirection = computed(() => {
  const g = props.snapshot?.grid
  if (!g) return ''
  if (g.isImporting) return 'Importing'
  if (g.isExporting) return 'Exporting'
  return 'Idle'
})

const batteryAccentColor = computed(() => {
  const b = props.snapshot?.battery
  if (!b) return 'var(--color-battery-idle)'
  if (b.isCharging)    return 'var(--color-battery-charging)'
  if (b.isDischarging) return 'var(--color-battery-discharging)'
  return 'var(--color-battery-idle)'
})

const gridAccentColor = computed(() => {
  const g = props.snapshot?.grid
  if (!g) return 'var(--color-battery-idle)'
  if (g.isExporting) return 'var(--color-grid-export)'
  if (g.isImporting) return 'var(--color-grid-import)'
  return 'var(--color-battery-idle)'
})

function isSensorUnavailable(concept: 'solar' | 'battery' | 'grid' | 'home'): boolean {
  if (!props.health) return false
  const h = props.health.live
  const map = {
    solar: h.solar,
    battery: h.batteryLevel,
    grid: h.gridImport,
    home: h.homeConsumption,
  } as const
  const sensor = map[concept]
  return sensor?.status === 'unavailable' || sensor?.status === 'invalid'
}
</script>

<template>
  <main
    class="now-panel"
    aria-label="Current energy state"
    :aria-busy="isLoading || undefined"
  >
    <!-- Insight: skeleton during connecting, content when live data arrives.
         This is the primary communication element — everything else supports it. -->
    <InsightBlock
      :title="insight?.title ?? ''"
      :description="insight?.description ?? ''"
      :detail="insight?.detail"
      :sentiment="insight?.sentiment ?? 'neutral'"
      :confidence="insight?.confidence ?? 'high'"
      :is-loading="isLoading"
    />

    <!--
      Body: always present in the DOM (no v-if).

      The diagram is always rendered so the dormant state is visible while
      connecting — users see their home's energy topology immediately, even
      before data arrives. The diagram handles its own dormant ↔ live
      transition via its :is-loading prop.

      The metric cards always render in their grid positions so the layout
      does not shift when data arrives. They show skeleton content during
      loading, then transition to real values.

      Explanation is primary: insight is above; diagram and metrics below.
      Screen readers receive aria-busy="true" on the parent until data arrives.
    -->
    <div class="now-panel__body">
      <EnergyFlowDiagram :snapshot="snapshot" :is-loading="isLoading" />

      <div class="now-panel__metrics" role="list" aria-label="Live power readings">
        <div role="listitem">
          <MetricCard
            label="Solar generation"
            :value="isLoading || isSensorUnavailable('solar') ? null : snapshot!.solar.generatingWatts"
            unit="W"
            concept="solar"
            :is-loading="isLoading"
          />
        </div>
        <div role="listitem">
          <MetricCard
            label="Battery"
            :value="isLoading || isSensorUnavailable('battery') ? null : batteryValue"
            unit="W"
            concept="battery"
            :direction-label="isLoading ? '' : batteryDirection"
            :accent-color="batteryAccentColor"
            :is-loading="isLoading"
          />
        </div>
        <div role="listitem">
          <MetricCard
            label="Grid"
            :value="isLoading || isSensorUnavailable('grid') ? null : gridValue"
            unit="W"
            concept="grid"
            :direction-label="isLoading ? '' : gridDirection"
            :accent-color="gridAccentColor"
            :is-loading="isLoading"
          />
        </div>
        <div role="listitem">
          <MetricCard
            label="Home consumption"
            :value="isLoading || isSensorUnavailable('home') ? null : snapshot!.home.consumingWatts"
            unit="W"
            concept="home"
            :is-loading="isLoading"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/*
 * container-type lets @container queries respond to this element's own width.
 * Critical for HA panels: the panel container is narrower than the viewport
 * (sidebar takes space), so a viewport media query would never trigger on
 * a large monitor with the HA sidebar open.
 *
 * Scroll is handled by the parent .cardinal-content div in App.vue.
 * NowPanel does not scroll — it sizes to its natural content height.
 */
.now-panel {
  container-type: inline-size;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  margin: 0;
}

.now-panel__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.now-panel__metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

/* Wide: diagram and metrics side by side.
   The layout is stable from first render — no shift when data arrives
   because both columns are always in the DOM. */
@container (min-width: 600px) {
  .now-panel__body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
    gap: var(--space-6);
  }

  .now-panel__metrics {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }
}
</style>
