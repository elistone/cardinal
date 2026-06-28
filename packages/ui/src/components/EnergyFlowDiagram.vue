<script setup lang="ts">
import { computed } from 'vue'
import type { EnergySnapshot } from '@cardinal/domain'
import { energyIntensity } from '../utils/energyIntensity.js'

interface Props {
  snapshot: EnergySnapshot | null
  isLoading?: boolean
}

const props = defineProps<Props>()

// ─── Layout ────────────────────────────────────────────────────────────────────
// Diamond arrangement in a 400 × 380 viewBox.
//        Solar  (top)
//       /      \
//   Grid        Battery
//       \      /
//        Home  (bottom)

const nodes = {
  solar:   { cx: 200, cy: 55  },
  grid:    { cx: 55,  cy: 195 },
  battery: { cx: 345, cy: 195 },
  home:    { cx: 200, cy: 330 },
}

const DIAMOND_CX = 200
const DIAMOND_CY = 190

// ─── Bezier control point ──────────────────────────────────────────────────────
// Quadratic bezier control point pushed outward from the diamond centre by
// `tension` pixels. Creates organic arcs that radiate away from the centre
// rather than crossing each other.

function bezierCP(
  x1: number, y1: number,
  x2: number, y2: number,
  tension = 30,
): { cx: number; cy: number } {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = mx - DIAMOND_CX
  const dy = my - DIAMOND_CY
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 8) {
    return { cx: mx + tension, cy: my }
  }
  return {
    cx: mx + (dx / len) * tension,
    cy: my + (dy / len) * tension,
  }
}

// ─── Flow magnitude → visual properties ───────────────────────────────────────
// Both helpers delegate to the shared energyIntensity utility so this diagram,
// MetricCard, and any future component all respond to the same watts→t mapping.

function flowDuration(watts: number): string {
  const t = energyIntensity(watts)
  // t=0 → 2.4s (slow, gentle).  t=1 → 0.8s (brisk, purposeful).
  return `${(2.4 - t * 1.6).toFixed(2)}s`
}

function strokeWidth(watts: number): number {
  const t = energyIntensity(watts)
  // t=0 → 1.5px.  t=1 → 3.5px.  Change remains perceptible but subtle.
  return 1.5 + t * 2
}

// ─── Flow paths ────────────────────────────────────────────────────────────────

interface FlowPath {
  id: string
  x1: number; y1: number
  x2: number; y2: number
  cpx: number; cpy: number
  d: string
  color: string
  active: boolean
  watts: number
  sw: number
  duration: string
}

const flows = computed<FlowPath[]>(() => {
  const s = props.snapshot

  const solarW     = s?.solar.generatingWatts     ?? 0
  const chargeW    = s?.battery.chargingWatts     ?? 0
  const dischargeW = s?.battery.dischargingWatts  ?? 0
  const exportW    = s?.grid.exportingWatts       ?? 0
  const importW    = s?.grid.importingWatts       ?? 0
  const homeW      = s?.home.consumingWatts       ?? 0

  const solarActive   = s?.solar.isGenerating     ?? false
  const battCharge    = s?.battery.isCharging     ?? false
  const battDischarge = s?.battery.isDischarging  ?? false
  const gridExport    = s?.grid.isExporting       ?? false
  const gridImport    = s?.grid.isImporting       ?? false

  const solarChargesBattery = battCharge && solarActive
  const gridChargesBattery  = battCharge && !solarActive

  const specs: Array<{
    id: string; x1: number; y1: number; x2: number; y2: number
    color: string; active: boolean; watts: number
  }> = [
    {
      id: 'solar-battery',
      x1: nodes.solar.cx,         y1: nodes.solar.cy + 24,
      x2: nodes.battery.cx - 20,  y2: nodes.battery.cy - 20,
      color: 'var(--color-solar)',
      active: solarChargesBattery,
      watts: solarChargesBattery ? chargeW : 0,
    },
    {
      id: 'solar-home',
      x1: nodes.solar.cx, y1: nodes.solar.cy + 24,
      x2: nodes.home.cx,  y2: nodes.home.cy - 24,
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
      x1: nodes.grid.cx + 24,    y1: nodes.grid.cy,
      x2: nodes.battery.cx - 24, y2: nodes.battery.cy,
      color: 'var(--color-grid-import)',
      active: gridChargesBattery,
      watts: gridChargesBattery ? chargeW : 0,
    },
  ]

  return specs.map(p => {
    const cp = bezierCP(p.x1, p.y1, p.x2, p.y2)
    return {
      ...p,
      cpx: cp.cx,
      cpy: cp.cy,
      d: `M ${p.x1} ${p.y1} Q ${cp.cx} ${cp.cy} ${p.x2} ${p.y2}`,
      sw: p.active ? strokeWidth(p.watts) : 1.5,
      duration: flowDuration(p.watts),
    }
  })
})

// Midpoint of a quadratic bezier at t=0.5
function qbMid(x1: number, y1: number, cpx: number, cpy: number, x2: number, y2: number) {
  const t = 0.5
  return {
    x: (1-t)*(1-t)*x1 + 2*(1-t)*t*cpx + t*t*x2,
    y: (1-t)*(1-t)*y1 + 2*(1-t)*t*cpy + t*t*y2,
  }
}

function wattsLabel(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(1)} kW`
  return `${watts.toFixed(0)} W`
}

const batteryLabel = computed(() => {
  const b = props.snapshot?.battery
  if (!b) return ''
  if (b.isCharging)    return `${b.chargePercent}% ↑`
  if (b.isDischarging) return `${b.chargePercent}% ↓`
  return `${b.chargePercent}%`
})

// Solar pulses when it is the active generation source.
// Battery and grid are intentionally excluded: their flow paths already
// communicate activity, and pulsing nodes would add redundant motion.
const solarIsGenerating = computed(() => props.snapshot?.solar.isGenerating ?? false)

// ─── Dormant topology ──────────────────────────────────────────────────────────

const DORMANT_PATHS = (() => {
  const s = [
    { x1: 200, y1: 79,  x2: 325, y2: 175 },
    { x1: 200, y1: 79,  x2: 200, y2: 306 },
    { x1: 180, y1: 73,  x2: 79,  y2: 175 },
    { x1: 325, y1: 215, x2: 220, y2: 312 },
    { x1: 79,  y1: 215, x2: 180, y2: 312 },
    { x1: 79,  y1: 195, x2: 321, y2: 195 },
  ]
  return s.map(p => {
    const cp = bezierCP(p.x1, p.y1, p.x2, p.y2, 20)
    return `M ${p.x1} ${p.y1} Q ${cp.cx} ${cp.cy} ${p.x2} ${p.y2}`
  })
})()
</script>

<template>
  <div class="energy-flow">

    <!-- ── Dormant state: shown while connecting ─────────────────────────── -->
    <template v-if="isLoading">
      <svg
        viewBox="0 0 400 380"
        class="energy-flow__svg energy-flow__svg--dormant"
        aria-hidden="true"
      >
        <g class="energy-flow__dormant-paths">
          <path
            v-for="(d, i) in DORMANT_PATHS"
            :key="i"
            :d="d"
            fill="none"
            stroke="var(--color-border)"
            stroke-width="1.5"
          />
        </g>

        <g class="energy-flow__dormant-nodes">
          <!-- Solar -->
          <circle :cx="nodes.solar.cx"   :cy="nodes.solar.cy"   r="22" class="energy-flow__dormant-node" />
          <g :transform="`translate(${nodes.solar.cx}, ${nodes.solar.cy})`" fill="none" stroke="var(--color-text-subdued)" stroke-width="1.5" stroke-linecap="round">
            <circle cx="0" cy="0" r="4.5" />
            <line x1="0" y1="-8" x2="0" y2="-6.5" /><line x1="0" y1="6.5" x2="0" y2="8" />
            <line x1="-8" y1="0" x2="-6.5" y2="0" /><line x1="6.5" y1="0" x2="8" y2="0" />
            <line x1="-5.7" y1="-5.7" x2="-4.6" y2="-4.6" /><line x1="4.6" y1="4.6" x2="5.7" y2="5.7" />
            <line x1="5.7" y1="-5.7" x2="4.6" y2="-4.6" /><line x1="-4.6" y1="4.6" x2="-5.7" y2="5.7" />
          </g>

          <!-- Grid -->
          <circle :cx="nodes.grid.cx"    :cy="nodes.grid.cy"    r="22" class="energy-flow__dormant-node" />
          <g :transform="`translate(${nodes.grid.cx}, ${nodes.grid.cy})`" fill="none" stroke="var(--color-text-subdued)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="2,-8 -2,-1 2,-1 -2,8" />
          </g>

          <!-- Battery -->
          <circle :cx="nodes.battery.cx" :cy="nodes.battery.cy" r="22" class="energy-flow__dormant-node" />
          <g :transform="`translate(${nodes.battery.cx}, ${nodes.battery.cy})`" stroke="var(--color-text-subdued)" stroke-width="1.5" fill="none">
            <rect x="-7" y="-5.5" width="14" height="11" rx="2" />
            <rect x="7" y="-2" width="2" height="4" rx="1" fill="var(--color-text-subdued)" stroke="none" />
          </g>

          <!-- Home -->
          <circle :cx="nodes.home.cx"    :cy="nodes.home.cy"    r="22" class="energy-flow__dormant-node" />
          <g :transform="`translate(${nodes.home.cx}, ${nodes.home.cy})`" fill="none" stroke="var(--color-text-subdued)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="-8,0 0,-8 8,0" />
            <rect x="-5.5" y="0" width="11" height="8" rx="1" />
            <rect x="-2" y="4" width="4" height="4" rx="0.5" />
          </g>
        </g>

        <g class="energy-flow__dormant-labels">
          <text :x="nodes.solar.cx"   :y="nodes.solar.cy - 32"   text-anchor="middle" font-size="11" fill="var(--color-text-subdued)">Solar</text>
          <text :x="nodes.grid.cx"    :y="nodes.grid.cy - 32"    text-anchor="middle" font-size="11" fill="var(--color-text-subdued)">Grid</text>
          <text :x="nodes.battery.cx" :y="nodes.battery.cy - 32" text-anchor="middle" font-size="11" fill="var(--color-text-subdued)">Battery</text>
          <text :x="nodes.home.cx"    :y="nodes.home.cy + 42"    text-anchor="middle" font-size="11" fill="var(--color-text-subdued)">Home</text>
        </g>
      </svg>
    </template>

    <!-- ── Live state ───────────────────────────────────────────────────── -->
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
          <!-- Only active flows get arrowheads — an arrowhead on an invisible
               inactive path communicates nothing and adds visual noise. -->
          <marker
            v-for="flow in flows.filter(f => f.active)"
            :id="`arrow-${flow.id}`"
            :key="`marker-${flow.id}`"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L6,3 z" :fill="flow.color" />
          </marker>
        </defs>

        <!-- ── Flow paths ──────────────────────────────────────────────── -->
        <!-- pathLength="100" normalises stroke-dasharray so --flow-duration
             controls perceived speed regardless of actual arc length. -->
        <g class="energy-flow__paths">
          <path
            v-for="flow in flows"
            :key="flow.id"
            :d="flow.d"
            fill="none"
            class="energy-flow__path"
            :class="{ 'energy-flow__path--active': flow.active }"
            :stroke="flow.active ? flow.color : 'var(--color-border)'"
            :stroke-width="flow.sw"
            pathLength="100"
            :style="{ '--flow-duration': flow.duration }"
            :marker-end="flow.active ? `url(#arrow-${flow.id})` : undefined"
          />
        </g>

        <!-- ── Watt labels on active paths ─────────────────────────────── -->
        <g class="energy-flow__labels">
          <text
            v-for="flow in flows.filter(f => f.active && f.watts > 0)"
            :key="`label-${flow.id}`"
            :x="qbMid(flow.x1, flow.y1, flow.cpx, flow.cpy, flow.x2, flow.y2).x"
            :y="qbMid(flow.x1, flow.y1, flow.cpx, flow.cpy, flow.x2, flow.y2).y - 7"
            class="energy-flow__watt-label"
            :fill="flow.color"
            text-anchor="middle"
            font-size="11"
            font-variant-numeric="tabular-nums"
          >{{ wattsLabel(flow.watts) }}</text>
        </g>

        <!-- ── Solar node ──────────────────────────────────────────────── -->
        <g class="energy-flow__node">
          <circle
            :cx="nodes.solar.cx" :cy="nodes.solar.cy" r="22"
            fill="var(--color-surface-raised)"
            stroke="var(--color-solar)"
            stroke-width="2"
            :class="{ 'energy-flow__node-circle--pulse': solarIsGenerating }"
            style="--node-color: var(--color-solar)"
          />
          <g :transform="`translate(${nodes.solar.cx}, ${nodes.solar.cy})`" fill="none" stroke="var(--color-solar)" stroke-width="1.5" stroke-linecap="round">
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
            :x="nodes.solar.cx" :y="nodes.solar.cy + 40"
            text-anchor="middle" font-size="11" font-variant-numeric="tabular-nums" fill="var(--color-solar)"
          >{{ wattsLabel(snapshot.solar.generatingWatts) }}</text>
        </g>

        <!-- ── Grid node ───────────────────────────────────────────────── -->
        <g class="energy-flow__node">
          <circle
            :cx="nodes.grid.cx" :cy="nodes.grid.cy" r="22"
            fill="var(--color-surface-raised)"
            :stroke="snapshot?.grid.isImporting ? 'var(--color-grid-import)' : snapshot?.grid.isExporting ? 'var(--color-grid-export)' : 'var(--color-border)'"
            stroke-width="2"
          />
          <g
            :transform="`translate(${nodes.grid.cx}, ${nodes.grid.cy})`" fill="none"
            :stroke="snapshot?.grid.isImporting ? 'var(--color-grid-import)' : snapshot?.grid.isExporting ? 'var(--color-grid-export)' : 'var(--color-text-subdued)'"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
          >
            <polyline points="2,-8 -2,-1 2,-1 -2,8" />
          </g>
          <text :x="nodes.grid.cx" :y="nodes.grid.cy - 32" text-anchor="middle" font-size="12" fill="var(--color-text-secondary)">Grid</text>
        </g>

        <!-- ── Battery node ────────────────────────────────────────────── -->
        <g class="energy-flow__node">
          <circle
            :cx="nodes.battery.cx" :cy="nodes.battery.cy" r="22"
            fill="var(--color-surface-raised)"
            :stroke="snapshot?.battery.isCharging ? 'var(--color-battery-charging)' : snapshot?.battery.isDischarging ? 'var(--color-battery-discharging)' : 'var(--color-border)'"
            stroke-width="2"
          />
          <g :transform="`translate(${nodes.battery.cx}, ${nodes.battery.cy})`" fill="none" stroke-linecap="round">
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
              x="-5.5" y="-4"
              :width="(snapshot.battery.chargePercent / 100) * 11"
              height="8" rx="1"
              :fill="snapshot.battery.isCharging ? 'var(--color-battery-charging)' : snapshot.battery.isDischarging ? 'var(--color-battery-discharging)' : 'var(--color-battery-idle)'"
              stroke="none" opacity="0.6"
            />
          </g>
          <text :x="nodes.battery.cx" :y="nodes.battery.cy - 32" text-anchor="middle" font-size="12" fill="var(--color-text-secondary)">Battery</text>
          <text
            v-if="batteryLabel"
            :x="nodes.battery.cx" :y="nodes.battery.cy + 40"
            text-anchor="middle" font-size="11" font-variant-numeric="tabular-nums"
            :fill="snapshot?.battery.isCharging ? 'var(--color-battery-charging)' : snapshot?.battery.isDischarging ? 'var(--color-battery-discharging)' : 'var(--color-text-subdued)'"
          >{{ batteryLabel }}</text>
        </g>

        <!-- ── Home node ───────────────────────────────────────────────── -->
        <g class="energy-flow__node">
          <circle
            :cx="nodes.home.cx" :cy="nodes.home.cy" r="22"
            fill="var(--color-surface-raised)"
            stroke="var(--color-home)"
            stroke-width="2"
          />
          <g :transform="`translate(${nodes.home.cx}, ${nodes.home.cy})`" fill="none" stroke="var(--color-text-secondary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="-8,0 0,-8 8,0" />
            <rect x="-5.5" y="0" width="11" height="8" rx="1" />
            <rect x="-2" y="4" width="4" height="4" rx="0.5" />
          </g>
          <text :x="nodes.home.cx" :y="nodes.home.cy + 42" text-anchor="middle" font-size="12" fill="var(--color-text-secondary)">Home</text>
          <text
            v-if="snapshot?.home.consumingWatts"
            :x="nodes.home.cx" :y="nodes.home.cy - 32"
            text-anchor="middle" font-size="11" font-variant-numeric="tabular-nums" fill="var(--color-text-subdued)"
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

/* ── Dormant state ──────────────────────────────────────────────────────────── */

.energy-flow__svg--dormant {
  opacity: 0.35;
}

/* Slow 4s breath — this is waiting, not loading. */
.energy-flow__dormant-node {
  fill: var(--color-surface-raised);
  stroke: var(--color-border);
  stroke-width: 2;
  animation: dormant-breath 4s ease-in-out infinite;
  animation-play-state: var(--cardinal-animation-play-state, running);
}

@media (prefers-reduced-motion: reduce) {
  .energy-flow__dormant-node {
    animation: none;
  }
}

@keyframes dormant-breath {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}

/* ── Live flow paths ────────────────────────────────────────────────────────── */

.energy-flow__path {
  transition: stroke 300ms ease, opacity 400ms ease, stroke-width 400ms ease;
}

.energy-flow__path--active {
  opacity: 1;
}

.energy-flow__path:not(.energy-flow__path--active) {
  opacity: 0.35;
}

@media (prefers-reduced-motion: no-preference) {
  .energy-flow__path--active {
    stroke-dasharray: 6 4;
    animation: flow-dash var(--flow-duration, 1.2s) linear infinite;
    animation-play-state: var(--cardinal-animation-play-state, running);
  }
}

@keyframes flow-dash {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: -10; }
}

/* Active energy source nodes pulse at their own concept colour.
   --node-color is set as an inline style per-node so the same @keyframes
   drives solar (amber) and battery-discharging (blue) with their own colours. */
@media (prefers-reduced-motion: no-preference) {
  .energy-flow__node-circle--pulse {
    animation: node-pulse 3s ease-in-out infinite;
    animation-play-state: var(--cardinal-animation-play-state, running);
  }
}

@keyframes node-pulse {
  0%, 100% { filter: drop-shadow(0 0 0px transparent); }
  50%       { filter: drop-shadow(0 0 6px var(--node-color, currentColor)); }
}

.energy-flow__watt-label {
  font-weight: 600;
  opacity: 0.9;
}
</style>
