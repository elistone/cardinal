<script setup lang="ts">
import { computed } from 'vue'
import type { EnergySnapshot, ConfigurationHealth } from '@cardinal/domain'

interface Props {
  snapshot: EnergySnapshot | null
  health: ConfigurationHealth | null
}

const props = defineProps<Props>()

// ─── Energy balance ───────────────────────────────────────────────────────────
// Sources: energy flowing into the home system
// Sinks:   energy flowing out of the home system
//
// A correctly mapped system satisfies:
//   solar + gridImport + batteryDischarging ≈ home + gridExport + batteryCharging
//
// A persistent imbalance (> ~10%) suggests a sensor is double-counted,
// has the wrong sign, or is mapped to the wrong entity.

const balance = computed(() => {
  const s = props.snapshot
  if (!s) return null

  const sources = s.solar.generatingWatts + s.grid.importingWatts + s.battery.dischargingWatts
  const sinks   = s.home.consumingWatts   + s.grid.exportingWatts + s.battery.chargingWatts

  const delta = Math.abs(sources - sinks)
  const magnitude = Math.max(sources, sinks, 1)
  const errorPct = (delta / magnitude) * 100

  const balanced = errorPct < 10

  // Identify the largest individual flow — the most likely culprit when unbalanced.
  const flows = [
    { label: 'Solar generation',     watts: s.solar.generatingWatts,  side: 'source' as const },
    { label: 'Grid import',          watts: s.grid.importingWatts,     side: 'source' as const },
    { label: 'Battery discharging',  watts: s.battery.dischargingWatts, side: 'source' as const },
    { label: 'Home consumption',     watts: s.home.consumingWatts,     side: 'sink' as const },
    { label: 'Grid export',          watts: s.grid.exportingWatts,     side: 'sink' as const },
    { label: 'Battery charging',     watts: s.battery.chargingWatts,   side: 'sink' as const },
  ]

  const suspect = !balanced
    ? flows.reduce((a, b) => (b.watts > a.watts ? b : a)).label
    : null

  return { sources, sinks, delta, errorPct, balanced, flows, suspect }
})

// ─── Entity table ─────────────────────────────────────────────────────────────

interface EntityRow {
  concept: string
  entityId: string
  value: number | null
  unit: string | null
}

const entityRows = computed((): EntityRow[] => {
  const h = props.health
  if (!h) return []

  const all = [
    { concept: 'Solar power',            c: h.live.solar },
    { concept: 'Battery charging',       c: h.live.batteryCharging },
    { concept: 'Battery discharging',    c: h.live.batteryDischarging },
    { concept: 'Battery level',          c: h.live.batteryLevel },
    { concept: 'Grid import',            c: h.live.gridImport },
    { concept: 'Grid export',            c: h.live.gridExport },
    { concept: 'Home consumption',       c: h.live.homeConsumption },
    { concept: 'Solar generated today',  c: h.daily.solarGenerated },
    { concept: 'Battery charged today',  c: h.daily.batteryCharged },
    { concept: 'Battery discharged today', c: h.daily.batteryDischarged },
    { concept: 'Grid imported today',    c: h.daily.gridImported },
    { concept: 'Grid exported today',    c: h.daily.gridExported },
    { concept: 'Home consumed today',    c: h.daily.homeConsumed },
  ]

  return all
    .filter(({ c }) => c.status !== 'missing' && c.entityId)
    .map(({ concept, c }) => ({
      concept,
      entityId: c.entityId!,
      value: c.value ?? null,
      unit: c.unit ?? null,
    }))
})

function fmt(v: number | null, unit: string | null): string {
  if (v === null) return '—'
  const n = v.toLocaleString(undefined, { maximumFractionDigits: 1 })
  return unit ? `${n} ${unit}` : n
}
</script>

<template>
  <aside class="diagnostics-panel" aria-label="Developer diagnostics">
    <header class="diagnostics-panel__header">
      <span class="diagnostics-panel__title">Developer Diagnostics</span>
    </header>

    <div class="diagnostics-panel__body">
      <!-- ── Energy balance ─────────────────────────────────────────────── -->
      <section class="diag-section">
        <h3 class="diag-section__title">Energy balance</h3>

        <template v-if="balance">
          <div
            class="diag-balance"
            :class="balance.balanced ? 'diag-balance--ok' : 'diag-balance--warn'"
          >
            <div class="diag-balance__equation">
              <span class="diag-balance__side">
                <span class="diag-balance__label">Sources</span>
                <span class="diag-balance__value">{{ balance.sources.toLocaleString(undefined, { maximumFractionDigits: 0 }) }} W</span>
              </span>
              <span class="diag-balance__sep">≈</span>
              <span class="diag-balance__side">
                <span class="diag-balance__label">Sinks</span>
                <span class="diag-balance__value">{{ balance.sinks.toLocaleString(undefined, { maximumFractionDigits: 0 }) }} W</span>
              </span>
              <span class="diag-balance__error">
                {{ balance.balanced ? 'Balanced' : `${balance.errorPct.toFixed(0)}% imbalance` }}
              </span>
            </div>
          </div>

          <div v-if="!balance.balanced" class="diag-balance-warn">
            <p class="diag-balance-warn__text">
              Sources and sinks differ by {{ balance.delta.toFixed(0) }} W
              ({{ balance.errorPct.toFixed(0) }}%). One or more mapped entities
              may be incorrect, double-counted, or have the wrong sign.
            </p>
            <p v-if="balance.suspect" class="diag-balance-warn__suspect">
              Largest flow: <strong>{{ balance.suspect }}</strong> — check this mapping first.
            </p>
          </div>

          <table class="diag-table">
            <thead>
              <tr>
                <th>Flow</th>
                <th>Side</th>
                <th class="diag-table__num">Watts</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in balance.flows" :key="f.label">
                <td>{{ f.label }}</td>
                <td class="diag-table__side">{{ f.side }}</td>
                <td class="diag-table__num">{{ f.watts.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
        <p v-else class="diag-empty">Waiting for snapshot…</p>
      </section>

      <!-- ── Raw entity values ─────────────────────────────────────────── -->
      <section class="diag-section">
        <h3 class="diag-section__title">Raw entity values</h3>
        <table v-if="entityRows.length" class="diag-table">
          <thead>
            <tr>
              <th>Concept</th>
              <th>Entity</th>
              <th class="diag-table__num">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in entityRows" :key="r.entityId + r.concept">
              <td>{{ r.concept }}</td>
              <td class="diag-table__entity">{{ r.entityId }}</td>
              <td class="diag-table__num">{{ fmt(r.value, r.unit) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="diag-empty">No entities configured.</p>
      </section>

      <!-- ── Translated snapshot ───────────────────────────────────────── -->
      <section class="diag-section">
        <h3 class="diag-section__title">Translated snapshot</h3>
        <template v-if="snapshot">
          <table class="diag-table">
            <tbody>
              <tr><td>Solar generating</td><td class="diag-table__num">{{ snapshot.solar.generatingWatts.toLocaleString() }} W</td></tr>
              <tr><td>Battery charge %</td><td class="diag-table__num">{{ snapshot.battery.chargePercent }} %</td></tr>
              <tr><td>Battery charging</td><td class="diag-table__num">{{ snapshot.battery.chargingWatts.toLocaleString() }} W</td></tr>
              <tr><td>Battery discharging</td><td class="diag-table__num">{{ snapshot.battery.dischargingWatts.toLocaleString() }} W</td></tr>
              <tr><td>Grid importing</td><td class="diag-table__num">{{ snapshot.grid.importingWatts.toLocaleString() }} W</td></tr>
              <tr><td>Grid exporting</td><td class="diag-table__num">{{ snapshot.grid.exportingWatts.toLocaleString() }} W</td></tr>
              <tr><td>Home consuming</td><td class="diag-table__num">{{ snapshot.home.consumingWatts.toLocaleString() }} W</td></tr>
              <tr v-if="snapshot.tariffs.importRate != null">
                <td>Import rate</td>
                <td class="diag-table__num">{{ snapshot.tariffs.importRate }} {{ snapshot.tariffs.currency }}/kWh</td>
              </tr>
              <tr v-if="snapshot.tariffs.exportRate != null">
                <td>Export rate</td>
                <td class="diag-table__num">{{ snapshot.tariffs.exportRate }} {{ snapshot.tariffs.currency }}/kWh</td>
              </tr>
            </tbody>
          </table>
          <p class="diag-timestamp">Updated {{ snapshot.timestamp.toLocaleTimeString() }}</p>
        </template>
        <p v-else class="diag-empty">Waiting for snapshot…</p>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.diagnostics-panel {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.diagnostics-panel__header {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.diagnostics-panel__title {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-subdued);
}

.diagnostics-panel__body {
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-height: 480px;
  overflow-y: auto;
}

.diag-section__title {
  margin: 0 0 var(--space-3) 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-subdued);
}

/* Balance display */
.diag-balance {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  border: 1px solid;
  margin-bottom: var(--space-3);
}

.diag-balance--ok {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.05);
}

.diag-balance--warn {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.diag-balance__equation {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.diag-balance__side {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.diag-balance__label {
  font-size: 0.6875rem;
  color: var(--color-text-subdued);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.diag-balance__value {
  font-variant-numeric: tabular-nums;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.diag-balance__sep {
  font-size: 1.25rem;
  color: var(--color-text-subdued);
}

.diag-balance__error {
  font-size: 0.8125rem;
  font-weight: 500;
  margin-left: auto;
}

.diag-balance--ok .diag-balance__error {
  color: var(--color-positive);
}

.diag-balance--warn .diag-balance__error {
  color: var(--color-negative);
}

.diag-balance-warn {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  margin-bottom: var(--space-3);
}

.diag-balance-warn__text,
.diag-balance-warn__suspect {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.diag-balance-warn__suspect {
  margin-top: var(--space-2);
  color: var(--color-text-primary);
}

/* Tables */
.diag-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.diag-table th {
  text-align: left;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-subdued);
  padding: 0 var(--space-2) var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.diag-table td {
  padding: var(--space-2) var(--space-2) var(--space-2) 0;
  color: var(--color-text-secondary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  vertical-align: middle;
}

.diag-table__num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: var(--color-text-primary) !important;
  white-space: nowrap;
}

.diag-table__side {
  color: var(--color-text-subdued) !important;
  font-size: 0.75rem;
}

.diag-table__entity {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--color-text-subdued) !important;
}

.diag-empty {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-subdued);
}

.diag-timestamp {
  margin: var(--space-2) 0 0 0;
  font-size: 0.75rem;
  color: var(--color-text-subdued);
}
</style>
