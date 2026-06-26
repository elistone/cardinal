<script setup lang="ts">
import { computed } from 'vue'
import type { EnergySnapshot, EnergyInsight, ConfigurationHealth } from '@cardinal/domain'
import { InsightBlock, EnergyFlowDiagram, MetricCard } from '@cardinal/ui'

interface Props {
  snapshot: EnergySnapshot
  insight: EnergyInsight
  health: ConfigurationHealth | null
}

const props = defineProps<Props>()

// ─── Battery metric ───────────────────────────────────────────────────────────
const batteryValue = computed(() => {
  const b = props.snapshot.battery
  if (b.isCharging) return b.chargingWatts
  if (b.isDischarging) return b.dischargingWatts
  return 0
})

const batteryDirection = computed(() => {
  const b = props.snapshot.battery
  const pct = `${b.chargePercent}%`
  if (b.isCharging) return `${pct} · Charging`
  if (b.isDischarging) return `${pct} · Discharging`
  return `${pct} · Standby`
})

// ─── Grid metric ──────────────────────────────────────────────────────────────
const gridValue = computed(() => {
  const g = props.snapshot.grid
  return g.isImporting ? g.importingWatts : g.exportingWatts
})

const gridDirection = computed(() => {
  const g = props.snapshot.grid
  if (g.isImporting) return 'Importing'
  if (g.isExporting) return 'Exporting'
  return 'Idle'
})

// ─── Sensor availability ──────────────────────────────────────────────────────
// A concept is unavailable if its sensor is mapped but HA reports it unavailable.
function isSensorUnavailable(concept: keyof typeof props.snapshot): boolean {
  if (!props.health) return false
  const h = props.health.live
  const map: Record<string, typeof h.solar> = {
    solar: h.solar,
    battery: h.batteryLevel,
    grid: h.gridImport,
    home: h.homeConsumption,
  }
  const sensor = map[concept as string]
  return sensor?.status === 'unavailable' || sensor?.status === 'invalid'
}
</script>

<template>
  <main class="now-section" aria-label="Current energy state">
    <h2 class="section-label">NOW</h2>

    <InsightBlock
      :title="insight.title"
      :description="insight.description"
      :detail="insight.detail"
      :sentiment="insight.sentiment"
      :confidence="insight.confidence"
    />

    <div class="now-content">
      <EnergyFlowDiagram :snapshot="snapshot" />

      <div class="now-metrics" role="list" aria-label="Live power readings">
        <div role="listitem">
          <MetricCard
            label="Solar output"
            :value="isSensorUnavailable('solar') ? null : snapshot.solar.generatingWatts"
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
            :value="isSensorUnavailable('home') ? null : snapshot.home.consumingWatts"
            unit="W"
            concept="home"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.now-section {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.section-label {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-subdued);
}

.now-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.now-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

/* Desktop: diagram and metrics side by side */
@media (min-width: 1024px) {
  .now-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
    gap: var(--space-6);
  }

  /* On desktop, metrics become a single column next to the diagram */
  .now-metrics {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }
}

/* Tablet: slightly wider cards */
@media (min-width: 600px) and (max-width: 1023px) {
  .now-metrics {
    gap: var(--space-4);
  }
}
</style>
