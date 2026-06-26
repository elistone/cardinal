<script setup lang="ts">
import type { EnergySnapshot, EnergyInsight } from '@cardinal/domain'
import { InsightBlock, EnergyFlowDiagram, MetricCard } from '@cardinal/ui'

interface Props {
  snapshot: EnergySnapshot | null
  insight: EnergyInsight | null
}

defineProps<Props>()
</script>

<template>
  <main class="state-disconnected" aria-label="Connection lost">
    <!-- Reconnecting banner -->
    <div class="reconnecting-banner" role="status">
      <span class="reconnecting-banner__dot" aria-hidden="true" />
      Reconnecting to Home Assistant…
    </div>

    <!-- Show last-known data dimmed, or a placeholder if no data at all -->
    <section class="now-section now-section--stale" aria-label="Last known state">
      <h2 class="section-label">NOW</h2>

      <template v-if="insight && snapshot">
        <InsightBlock
          :title="insight.title"
          :description="insight.description"
          :detail="insight.detail"
          :sentiment="insight.sentiment"
          :confidence="insight.confidence"
        />

        <div class="now-content">
          <EnergyFlowDiagram :snapshot="snapshot" />

          <div class="now-metrics">
            <MetricCard
              label="Solar output"
              :value="snapshot.solar.generatingWatts"
              unit="W"
              concept="solar"
            />
            <MetricCard
              label="Battery"
              :value="snapshot.battery.isCharging ? snapshot.battery.chargingWatts : snapshot.battery.isDischarging ? snapshot.battery.dischargingWatts : 0"
              unit="W"
              concept="battery"
              :direction-label="snapshot.battery.isCharging ? `${snapshot.battery.chargePercent}% · Charging` : snapshot.battery.isDischarging ? `${snapshot.battery.chargePercent}% · Discharging` : `${snapshot.battery.chargePercent}% · Standby`"
            />
            <MetricCard
              label="Grid"
              :value="snapshot.grid.isImporting ? snapshot.grid.importingWatts : snapshot.grid.exportingWatts"
              unit="W"
              concept="grid"
              :direction-label="snapshot.grid.isImporting ? 'Importing' : snapshot.grid.isExporting ? 'Exporting' : 'Idle'"
            />
            <MetricCard
              label="Home consumption"
              :value="snapshot.home.consumingWatts"
              unit="W"
              concept="home"
            />
          </div>
        </div>
      </template>

      <template v-else>
        <p class="state-disconnected__no-data">
          Waiting for data after reconnection.
        </p>
      </template>
    </section>
  </main>
</template>

<style scoped>
.state-disconnected {
  flex: 1;
  overflow-y: auto;
}

.reconnecting-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: rgba(245, 158, 11, 0.08);
  border-bottom: 1px solid rgba(245, 158, 11, 0.15);
  font-size: 0.875rem;
  color: var(--color-health-unavailable);
}

.reconnecting-banner__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-health-unavailable);
  flex-shrink: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .reconnecting-banner__dot {
    animation: none;
    opacity: 0.6;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.now-section {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.now-section--stale {
  opacity: 0.5;
  pointer-events: none;
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

@media (min-width: 1024px) {
  .now-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
    gap: var(--space-6);
  }

  .now-metrics {
    grid-template-columns: 1fr;
  }
}

.state-disconnected__no-data {
  margin: 0;
  color: var(--color-text-subdued);
  font-size: 0.875rem;
}
</style>
