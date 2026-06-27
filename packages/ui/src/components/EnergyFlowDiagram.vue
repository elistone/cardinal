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
  strokeWidth: number
  flowDuration: string
}

// Flow animation speed and stroke weight both scale with power magnitude.
//
// Speed: more watts = shorter duration = faster dash movement.
// Curve: logarithmic so differences are perceptible at both low and high ends.
//   At   100 W → ~2.2 s/cycle (slow, gentle)
//   At  1000 W → ~1.4 s/cycle
//   At  4000 W → ~0.8 s/cycle (brisk, purposeful)
//
// Stroke: 1.5 px at low watts, up to 3.5 px at high watts.
// Using the same logarithmic scale keeps both properties visually consistent.

function flowDuration(watts: number): string {
  if (watts <= 0) return '1.2s'
  const clamped = Math.max(50, Math.min(watts, 5000))
  const t = Math.log10(clamped / 50) / Math.log10(5000 / 50)  // 0–1
  const duration = 2.4 - t * 1.6                               // 2.4s → 0.8s
  return `${duration.toFixed(2)}s`
}

function strokeWidth(watts: number): number {
  if (watts <= 0) return 1.5
  const clamped = Math.max(50, Math.min(watts, 5000))
  const t = Math.log10(clamped / 50) / Math.log10(5000 / 50)
  return 1.5 + t * 2                                           // 1.5 → 3.5
}

const flows = computed<FlowPath[]>(() => {
  const s = props.snapshot

  const solarW     = s?.solar.generatingWatts     ?? 0
  const chargeW    = s?.battery.chargingWatts     ?? 0
  const dischargeW = s?.battery.dischargingWatts  ?? 0
  const exportW    = s?.grid.exportingWatts       ?? 0
  const importW    = s?.grid.importingWatts       ?? 0
  const homeW      = s?.home.consumingWatts       ?? 0

  const solarActive   = s?.solar.isGenerating      ?? false
  const battCharge    = s?.battery.isCharging      ?? false
  const battDischarge = s?.battery.isDischarging   ?? false
  const gridExport    = s?.grid.isExporting        ?? false
  const gridImport    = s?.grid.isImporting        ?? false

  const solarChargesBattery = battCharge && solarActive
  const gridChargesBattery  = battCharge && !solarActive

  const paths: Array<Omit<FlowPath, 'strokeWidth' | 'flowDuration'>> = [
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

  return paths.map(p => ({
    ...p,
    strokeWidth: p.active ? strokeWidth(p.watts) : 1.5,
    flowDuration: flowDuration(p.watts),
  }))
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

// Whether a node is the dominant active source (drives the subtle pulse).
const activeSources = computed(() => ({
  solar:   props.snapshot?.solar.isGenerating ?? false,
  battery: props.snapshot?.battery.isDischarging ?? false,
  grid:    props.snapshot?.grid.isImporting ?? false,
  home:    (props.snapshot?.home.consumingWatts ?? 0) > 0,
}))
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
        role="img"
        aria-labelledby="energy-flow-title energy-flow-desc"
      >
        <title id="energy-flow-title">Energy flow diagram</title>
        <desc id="energy-flow-desc">
          Real-time power flows between solar panels, battery storage, the electricity grid, and your home.
        </desc>
        <defs>
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

        <!-- Flow paths — stroke-width and animation speed scale with watts -->
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
            :stroke-width="flow.strokeWidth"
            :style="{ '--flow-duration': flow.flowDuration }"
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

        <!-- ── Solar node ────────────────────────────────────────────── -->
        <g class="energy-flow__node energy-flow__node--solar">
          <circle
            :cx="nodes.solar.cx"
            :cy="nodes.solar.cy"
            r="22"
            fill="var(--color-surface-raised)"
            stroke="var(--color-solar)"
            stroke-width="2"
            :class="{ 'energy-flow__node-circle--pulse': activeSources.solar }"
          />
          <!-- Sun: centre circle + 8 short rays -->
          <g
            :transform="`translate(${nodes.solar.cx}, ${nodes.solar.cy})`"
            fill="none"
            stroke="var(--color-solar)"
            stroke-width="1.5"
            stroke-linecap="round"
          >
            <circle cx="0" cy="0" r="4.5" />
            <line x1="0"    y1="-8"   x2="0"    y2="-6.5" />
            <line x1="0"    y1="6.5"  x2="0"    y2="8" />
            <line x1="-8"   y1="0"    x2="-6.5" y2="0" />
            <line x1="6.5"  y1="0"    x2="8"    y2="0" />
            <line x1="-5.7" y1="-5.7" x2="-4.6" y2="-4.6" />
            <line x1="4.6"  y1="4.6"  x2="5.7"  y2="5.7" />
            <line x1="5.7"  y1="-5.7" x2="4.6"  y2="-4.6" />
            <line x1="-4.6" y1="4.6"  x2="-5.7" y2="5.7" />
          </g>
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

        <!-- ── Grid node ─────────────────────────────────────────────── -->
        <g class="energy-flow__node energy-flow__node--grid">
          <circle
            :cx="nodes.grid.cx"
            :cy="nodes.grid.cy"
            r="22"
            fill="var(--color-surface-raised)"
            :stroke="snapshot?.grid.isImporting ? 'var(--color-grid-import)' : snapshot?.grid.isExporting ? 'var(--color-grid-export)' : 'var(--color-border)'"
            stroke-width="2"
          />
          <!-- Lightning bolt -->
          <g
            :transform="`translate(${nodes.grid.cx}, ${nodes.grid.cy})`"
            fill="none"
            :stroke="snapshot?.grid.isImporting ? 'var(--color-grid-import)' : snapshot?.grid.isExporting ? 'var(--color-grid-export)' : 'var(--color-text-subdued)'"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="2,-8 -2,-1 2,-1 -2,8" />
          </g>
          <text :x="nodes.grid.cx" :y="nodes.grid.cy - 32" text-anchor="middle" font-size="12" fill="var(--color-text-secondary)">Grid</text>
        </g>

        <!-- ── Battery node ──────────────────────────────────────────── -->
        <g class="energy-flow__node energy-flow__node--battery">
          <circle
            :cx="nodes.battery.cx"
            :cy="nodes.battery.cy"
            r="22"
            fill="var(--color-surface-raised)"
            :stroke="snapshot?.battery.isCharging ? 'var(--color-battery-charging)' : snapshot?.battery.isDischarging ? 'var(--color-battery-discharging)' : 'var(--color-border)'"
            stroke-width="2"
          />
          <!-- Battery body with proportional charge fill -->
          <g
            :transform="`translate(${nodes.battery.cx}, ${nodes.battery.cy})`"
            fill="none"
            stroke-linecap="round"
          >
            <rect x="-7" y="-5.5" width="14" height="11" rx="2"
              :stroke="snapshot?.battery.isCharging ? 'var(--color-battery-charging)' : snapshot?.battery.isDischarging ? 'var(--color-battery-discharging)' : 'var(--color-text-subdued)'"
              stroke-width="1.5"
            />
            <rect x="7" y="-2" width="2" height="4" rx="1"
              :fill="snapshot?.battery.isCharging ? 'var(--color-battery-charging)' : snapshot?.battery.isDischarging ? 'var(--color-battery-discharging)' : 'var(--color-text-subdued)'"
              stroke="none"
            />
            <rect
              v-if="snapshot?.battery.chargePercent != null"
              x="-5.5"
              y="-4"
              :width="(snapshot.battery.chargePercent / 100) * 11"
              height="8"
              rx="1"
              :fill="snapshot.battery.isCharging ? 'var(--color-battery-charging)' : snapshot.battery.isDischarging ? 'var(--color-battery-discharging)' : 'var(--color-battery-idle)'"
              stroke="none"
              opacity="0.6"
            />
          </g>
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

        <!-- ── Home node ─────────────────────────────────────────────── -->
        <g class="energy-flow__node energy-flow__node--home">
          <circle
            :cx="nodes.home.cx"
            :cy="nodes.home.cy"
            r="22"
            fill="var(--color-surface-raised)"
            stroke="var(--color-home)"
            stroke-width="2"
          />
          <!-- House: roof peak + walls + door -->
          <g
            :transform="`translate(${nodes.home.cx}, ${nodes.home.cy})`"
            fill="none"
            stroke="var(--color-text-secondary)"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="-8,0 0,-8 8,0" />
            <rect x="-5.5" y="0" width="11" height="8" rx="1" />
            <rect x="-2" y="4" width="4" height="4" rx="0.5" />
          </g>
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
  /* Opacity transition gives paths a smooth emerge/fade rather than snapping on/off. */
  transition: stroke 300ms ease, opacity 400ms ease, stroke-width 400ms ease;
}

.energy-flow__path--active {
  opacity: 1;
}

.energy-flow__path:not(.energy-flow__path--active) {
  opacity: 0.2;
}

/* Flow animation: dash speed driven by --flow-duration (set inline, scaled to watts).
   Faster = more energy moving. This is information, not decoration. */
@media (prefers-reduced-motion: no-preference) {
  .energy-flow__path--active {
    stroke-dasharray: 6 4;
    animation: flow-dash var(--flow-duration, 1.2s) linear infinite;
  }
}

@keyframes flow-dash {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: -20; }
}

/* Active source node: a slow, breathing outer glow communicates
   "this node is contributing" without demanding attention.
   filter:drop-shadow is GPU-composited on SVG elements. */
@media (prefers-reduced-motion: no-preference) {
  .energy-flow__node-circle--pulse {
    animation: node-pulse 3s ease-in-out infinite;
  }
}

@keyframes node-pulse {
  0%, 100% { filter: drop-shadow(0 0 0px transparent); }
  50%       { filter: drop-shadow(0 0 6px var(--color-solar)); }
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
