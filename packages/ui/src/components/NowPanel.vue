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

const batteryDirection = computed(() => {
  const b = props.snapshot?.battery
  if (!b) return ''
  const pct = `${b.chargePercent}%`
  if (b.isCharging) return `${pct} · Charging`
  if (b.isDischarging) return `${pct} · Discharging`
  return `${pct} · Standby`
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
    <h2 class="now-panel__label">NOW</h2>

    <InsightBlock
      :title="insight?.title ?? ''"
      :description="insight?.description ?? ''"
      :detail="insight?.detail"
      :sentiment="insight?.sentiment ?? 'neutral'"
      :confidence="insight?.confidence ?? 'high'"
      :is-loading="isLoading"
    />

    <!-- The body fades in 100ms after the insight settles.
         The delay creates a subtle hierarchy: explanation first, evidence second.
         v-if keeps the body out of the DOM while loading so screen readers
         do not encounter empty metric cards. -->
    <Transition name="now-panel-body">
      <div v-if="!isLoading" class="now-panel__body">
        <EnergyFlowDiagram :snapshot="snapshot" :is-loading="false" />

        <div class="now-panel__metrics" role="list" aria-label="Live power readings">
          <div role="listitem">
            <MetricCard
              label="Solar output"
              :value="isSensorUnavailable('solar') ? null : snapshot!.solar.generatingWatts"
              unit="W"
              concept="solar"
            />
          </div>
          <div role="listitem">
            <MetricCard
              label="Battery"
              :value="isSensorUnavailable('battery') ? null : batteryValue"
              unit="W"
              concept="battery"
              :direction-label="batteryDirection"
            />
          </div>
          <div role="listitem">
            <MetricCard
              label="Grid"
              :value="isSensorUnavailable('grid') ? null : gridValue"
              unit="W"
              concept="grid"
              :direction-label="gridDirection"
            />
          </div>
          <div role="listitem">
            <MetricCard
              label="Home consumption"
              :value="isSensorUnavailable('home') ? null : snapshot!.home.consumingWatts"
              unit="W"
              concept="home"
            />
          </div>
        </div>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
/*
 * container-type lets @container queries respond to this element's own width
 * rather than the viewport width.  This is critical for HA panels: the panel
 * container is narrower than the viewport (sidebar takes space), so a viewport
 * media query at 1024px would never trigger even on a 1440px monitor.
 */
.now-panel {
  container-type: inline-size;
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  margin: 0;
}

.now-panel__label {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-subdued);
}

/* Extra breathing room between the explanation and the supporting evidence. */
.now-panel__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin-top: var(--space-2);
}

.now-panel__metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

/* Wide: diagram and metric stack side by side */
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

/* ── Loading → live stagger ─────────────────────────────────────────────────
   The body (diagram + metrics) fades in 100ms after the insight arrives.
   This communicates that the explanation is primary; the numbers are evidence.
   GPU-composited: opacity + transform only.
*/
.now-panel-body-enter-active {
  transition: opacity 300ms ease-out, transform 300ms ease-out;
  transition-delay: 100ms;
}
.now-panel-body-leave-active {
  transition: opacity 150ms ease-in;
}
.now-panel-body-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.now-panel-body-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .now-panel-body-enter-active,
  .now-panel-body-leave-active {
    transition: none;
  }
  .now-panel-body-enter-from {
    opacity: 1;
    transform: none;
  }
}
</style>
