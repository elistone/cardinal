<script setup lang="ts">
import { computed } from 'vue'
import type { EnergySnapshot } from '@cardinal/domain'

interface Props {
  snapshot: EnergySnapshot | null
  isLoading?: boolean
}

const props = defineProps<Props>()

// Node centres in a 400 × 380 viewBox — diamond layout:
//        Solar  (top)
//       /      \
//   Grid        Battery
//       \      /
//        Home  (bottom)
const nodes = {
  solar:   { cx: 200, cy: 55,  label: 'Solar' },
  grid:    { cx: 55,  cy: 195, label: 'Grid' },
  battery: { cx: 345, cy: 195, label: 'Battery' },
  home:    { cx: 200, cy: 330, label: 'Home' },
}

interface FlowPath {
  id: string
  x1: number; y1: number
  x2: number; y2: number
  color: string
  active: boolean
  watts: number
}

const flows = computed<FlowPath[]>(() => {
  const s = props.snapshot

  const solarW  = s?.solar.generatingWatts  ?? 0
  const chargeW = s?.battery.chargingWatts  ?? 0
  const dischargeW = s?.battery.dischargingWatts ?? 0
  const exportW = s?.grid.exportingWatts ?? 0
  const importW = s?.grid.importingWatts ?? 0
  const homeW   = s?.home.consumingWatts ?? 0

  const solarActive   = s?.solar.isGenerating ?? false
  const battCharge    = s?.battery.isCharging  ?? false
  const battDischarge = s?.battery.isDischarging ?? false
  const gridExport    = s?.grid.isExporting ?? false
  const gridImport    = s?.grid.isImporting ?? false

  // Heuristic: if battery is charging and solar is generating, assume solar charges battery.
  // If charging but no solar, grid is charging battery.
  const solarChargesBattery = battCharge && solarActive
  const gridChargesBattery  = battCharge && !solarActive

  return [
    {
      id: 'solar-battery',
      x1: nodes.solar.cx, y1: nodes.solar.cy + 24,
      x2: nodes.battery.cx - 20, y2: nodes.battery.cy - 20,
      color: 'var(--color-solar)',
      active: solarChargesBattery,
      watts: solarChargesBattery ? chargeW : 0,
    },
    {
      id: 'solar-home',
      x1: nodes.solar.cx, y1: nodes.solar.cy + 24,
      x2: nodes.home.cx, y2: nodes.home.cy - 24,
      color: 'var(--color-solar)',
      active: solarActive && homeW > 0,
      watts: solarActive ? Math.min(solarW, homeW) : 0,
    },
    {
      id: 'solar-grid',
      x1: nodes.solar.cx - 20, y1: nodes.solar.cy + 18,
      x2: nodes.grid.cx + 20,  y2: nodes.grid.cy - 20,
      color: 'var(--color-grid-export)',
      active: gridExport,
      watts: exportW,
    },
    {
      id: 'battery-home',
      x1: nodes.battery.cx - 20, y1: nodes.battery.cy + 20,
      x2: nodes.home.cx + 20,    y2: nodes.home.cy - 18,
      color: 'var(--color-battery-discharging)',
      active: battDischarge,
      watts: dischargeW,
    },
    {
      id: 'grid-home',
      x1: nodes.grid.cx + 20, y1: nodes.grid.cy + 20,
      x2: nodes.home.cx - 20, y2: nodes.home.cy - 18,
      color: 'var(--color-grid-import)',
      active: gridImport,
      watts: importW,
    },
    {
      id: 'grid-battery',
      x1: nodes.grid.cx + 24, y1: nodes.grid.cy,
      x2: nodes.battery.cx - 24, y2: nodes.battery.cy,
      color: 'var(--color-grid-import)',
      active: gridChargesBattery,
      watts: gridChargesBattery ? chargeW : 0,
    },
  ]
})

function wattsLabel(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(1)} kW`
  return `${watts.toFixed(0)} W`
}

const batteryLabel = computed(() => {
  const b = props.snapshot?.battery
  if (!b) return ''
  if (b.isCharging) return `${b.chargePercent}% ↑`
  if (b.isDischarging) return `${b.chargePercent}% ↓`
  return `${b.chargePercent}%`
})
</script>

<template>
  <div class="energy-flow" :class="{ 'energy-flow--loading': isLoading }">
    <template v-if="isLoading">
      <div class="energy-flow__placeholder" aria-label="Loading energy flow diagram" aria-busy="true">
        <div class="energy-flow__placeholder-inner" aria-hidden="true" />
      </div>
    </template>
    <template v-else>
      <svg
        viewBox="0 0 400 380"
        class="energy-flow__svg"
        aria-label="Energy flow diagram showing power movement between solar, battery, grid and home"
        role="img"
      >
        <defs>
          <!-- Arrow markers per flow color -->
          <marker
            v-for="flow in flows"
            :id="`arrow-${flow.id}`"
            :key="`marker-${flow.id}`"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path
              d="M0,0 L0,6 L6,3 z"
              :fill="flow.active ? flow.color : 'var(--color-border)'"
            />
          </marker>
        </defs>

        <!-- Flow paths -->
        <g class="energy-flow__paths">
          <line
            v-for="flow in flows"
            :key="flow.id"
            :x1="flow.x1"
            :y1="flow.y1"
            :x2="flow.x2"
            :y2="flow.y2"
            class="energy-flow__path"
            :class="{ 'energy-flow__path--active': flow.active }"
            :stroke="flow.active ? flow.color : 'var(--color-border)'"
            stroke-width="2"
            :marker-end="`url(#arrow-${flow.id})`"
          />
        </g>

        <!-- Flow watt labels on active paths -->
        <g class="energy-flow__labels">
          <text
            v-for="flow in flows.filter(f => f.active && f.watts > 0)"
            :key="`label-${flow.id}`"
            :x="(flow.x1 + flow.x2) / 2"
            :y="(flow.y1 + flow.y2) / 2 - 6"
            class="energy-flow__watt-label"
            :fill="flow.color"
            text-anchor="middle"
            font-size="11"
          >
            {{ wattsLabel(flow.watts) }}
          </text>
        </g>

        <!-- Nodes -->
        <!-- Solar -->
        <g class="energy-flow__node energy-flow__node--solar">
          <circle
            :cx="nodes.solar.cx"
            :cy="nodes.solar.cy"
            r="22"
            fill="var(--color-surface-raised)"
            stroke="var(--color-solar)"
            stroke-width="2"
            :class="{ 'energy-flow__node-circle--active': snapshot?.solar.isGenerating }"
          />
          <text :x="nodes.solar.cx" :y="nodes.solar.cy + 5" text-anchor="middle" font-size="13" font-weight="600" fill="var(--color-solar)">☀</text>
          <text :x="nodes.solar.cx" :y="nodes.solar.cy - 32" text-anchor="middle" font-size="12" fill="var(--color-text-secondary)">Solar</text>
          <text
            v-if="snapshot?.solar.generatingWatts"
            :x="nodes.solar.cx"
            :y="nodes.solar.cy + 40"
            text-anchor="middle"
            font-size="11"
            fill="var(--color-solar)"
          >{{ wattsLabel(snapshot.solar.generatingWatts) }}</text>
        </g>

        <!-- Grid -->
        <g class="energy-flow__node energy-flow__node--grid">
          <circle
            :cx="nodes.grid.cx"
            :cy="nodes.grid.cy"
            r="22"
            fill="var(--color-surface-raised)"
            :stroke="snapshot?.grid.isImporting ? 'var(--color-grid-import)' : snapshot?.grid.isExporting ? 'var(--color-grid-export)' : 'var(--color-border)'"
            stroke-width="2"
          />
          <text :x="nodes.grid.cx" :y="nodes.grid.cy + 5" text-anchor="middle" font-size="13" font-weight="600" fill="var(--color-text-secondary)">⚡</text>
          <text :x="nodes.grid.cx" :y="nodes.grid.cy - 32" text-anchor="middle" font-size="12" fill="var(--color-text-secondary)">Grid</text>
        </g>

        <!-- Battery -->
        <g class="energy-flow__node energy-flow__node--battery">
          <circle
            :cx="nodes.battery.cx"
            :cy="nodes.battery.cy"
            r="22"
            fill="var(--color-surface-raised)"
            :stroke="snapshot?.battery.isCharging ? 'var(--color-battery-charging)' : snapshot?.battery.isDischarging ? 'var(--color-battery-discharging)' : 'var(--color-border)'"
            stroke-width="2"
          />
          <text :x="nodes.battery.cx" :y="nodes.battery.cy + 5" text-anchor="middle" font-size="13" font-weight="600" fill="var(--color-text-secondary)">🔋</text>
          <text :x="nodes.battery.cx" :y="nodes.battery.cy - 32" text-anchor="middle" font-size="12" fill="var(--color-text-secondary)">Battery</text>
          <text
            v-if="batteryLabel"
            :x="nodes.battery.cx"
            :y="nodes.battery.cy + 40"
            text-anchor="middle"
            font-size="11"
            :fill="snapshot?.battery.isCharging ? 'var(--color-battery-charging)' : snapshot?.battery.isDischarging ? 'var(--color-battery-discharging)' : 'var(--color-text-subdued)'"
          >{{ batteryLabel }}</text>
        </g>

        <!-- Home -->
        <g class="energy-flow__node energy-flow__node--home">
          <circle
            :cx="nodes.home.cx"
            :cy="nodes.home.cy"
            r="22"
            fill="var(--color-surface-raised)"
            stroke="var(--color-home)"
            stroke-width="2"
          />
          <text :x="nodes.home.cx" :y="nodes.home.cy + 5" text-anchor="middle" font-size="13" font-weight="600" fill="var(--color-text-secondary)">🏠</text>
          <text :x="nodes.home.cx" :y="nodes.home.cy + 42" text-anchor="middle" font-size="12" fill="var(--color-text-secondary)">Home</text>
          <text
            v-if="snapshot?.home.consumingWatts"
            :x="nodes.home.cx"
            :y="nodes.home.cy - 32"
            text-anchor="middle"
            font-size="11"
            fill="var(--color-text-subdued)"
          >{{ wattsLabel(snapshot.home.consumingWatts) }}</text>
        </g>
      </svg>
    </template>
  </div>
</template>

<style scoped>
.energy-flow {
  width: 100%;
}

.energy-flow__svg {
  width: 100%;
  height: auto;
  display: block;
}

.energy-flow__path {
  transition: stroke 300ms ease, opacity 300ms ease;
}

.energy-flow__path--active {
  opacity: 1;
}

.energy-flow__path:not(.energy-flow__path--active) {
  opacity: 0.25;
}

/* Flow animation on active paths */
@media (prefers-reduced-motion: no-preference) {
  .energy-flow__path--active {
    stroke-dasharray: 6 4;
    animation: flow-dash 1.2s linear infinite;
  }
}

@keyframes flow-dash {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: -20; }
}

.energy-flow__watt-label {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  opacity: 0.9;
}

/* Loading placeholder */
.energy-flow__placeholder {
  aspect-ratio: 400 / 380;
  width: 100%;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
}

.energy-flow__placeholder-inner {
  width: 60%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    var(--color-surface-raised) 25%,
    rgba(255, 255, 255, 0.04) 50%,
    var(--color-surface-raised) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .energy-flow__placeholder-inner {
    animation: none;
    background: var(--color-surface-raised);
  }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
