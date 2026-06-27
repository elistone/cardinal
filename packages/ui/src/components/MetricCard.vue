<script setup lang="ts">
import { computed } from 'vue'
import { useAnimatedNumber } from '../composables/useAnimatedNumber.js'
import { energyIntensity } from '../utils/energyIntensity.js'

interface Props {
  label: string
  value: number | null
  unit: string
  concept: 'solar' | 'battery' | 'grid' | 'home'
  directionLabel?: string
  isLoading?: boolean
  // Overrides the concept-default accent colour. Pass a CSS value such as
  // 'var(--color-battery-discharging)' to reflect the current energy state.
  // When omitted, the concept's primary colour is used as a fallback.
  accentColor?: string
}

const props = defineProps<Props>()

// Concept-default accent colours — overridden by `accentColor` prop when the
// parent (NowPanel) knows the specific state (charging vs discharging, etc.).
const CONCEPT_COLORS: Record<Props['concept'], string> = {
  solar:   'var(--color-solar)',
  battery: 'var(--color-battery-charging)',
  grid:    'var(--color-grid-import)',
  home:    'var(--color-home)',
}

// Normalised intensity [0, 1] drives all visual magnitude cues:
// accent bar height, accent bar opacity, and ambient background tint.
// Uses the same log scale as EnergyFlowDiagram so they respond identically.
const intensity = computed(() =>
  props.value !== null && props.value > 0 ? energyIntensity(props.value) : 0,
)

// CSS variables applied to the root element. Transitions on height and opacity
// produce a smooth visual response as power levels change between readings.
const cardStyle = computed(() => ({
  '--metric-accent':      props.accentColor ?? CONCEPT_COLORS[props.concept],
  '--metric-accent-h':    `${2 + intensity.value * 2}px`,
  '--metric-accent-op':   `${(0.45 + intensity.value * 0.55).toFixed(2)}`,
  '--metric-bg-op':       `${(intensity.value * 0.05).toFixed(3)}`,
}))

// Animated display value — smoothly counts between readings.
const animatedValue = useAnimatedNumber(() => props.value)

function formatValue(value: number, unit: string): string {
  if (unit === 'kW' || unit === 'W') {
    if (value >= 1000) return (value / 1000).toFixed(1)
    return value.toFixed(0)
  }
  return value.toFixed(1)
}

function resolvedUnit(value: number, unit: string): string {
  if ((unit === 'kW' || unit === 'W') && value >= 1000) return 'kW'
  if ((unit === 'kW' || unit === 'W') && value < 1000) return 'W'
  return unit
}

const displayValue = computed(() => {
  if (animatedValue.value === null) return '—'
  return formatValue(animatedValue.value, props.unit)
})

const displayUnit = computed(() => {
  if (animatedValue.value === null) return ''
  return resolvedUnit(animatedValue.value, props.unit)
})

// Screen-reader announcement uses the *final* prop value, not the animated
// intermediate — assistive technology hears the settled number, not each frame.
const srValue = computed(() => {
  if (props.value === null) return `${props.label}: unavailable`
  return `${props.label}: ${formatValue(props.value, props.unit)} ${resolvedUnit(props.value, props.unit)}`
})

// Forces the flash animation to replay on each settled value change.
const flashKey = computed(() => String(props.value))
</script>

<template>
  <div
    class="metric-card"
    :class="[`metric-card--${concept}`, {
      'metric-card--loading': isLoading,
      'metric-card--unavailable': value === null && !isLoading,
    }]"
    :style="cardStyle"
  >
    <!-- ::before — accent bar (height and opacity scale with intensity)    -->
    <!-- ::after  — ambient background tint (very low opacity, same colour) -->

    <template v-if="isLoading">
      <div class="metric-card__skeleton metric-card__skeleton--value" aria-hidden="true" />
      <div class="metric-card__skeleton metric-card__skeleton--label" aria-hidden="true" />
    </template>
    <template v-else>
      <span class="metric-card__sr-announce" aria-live="polite" aria-atomic="true">
        {{ srValue }}
      </span>

      <div class="metric-card__value-row" aria-hidden="true">
        <span :key="flashKey" class="metric-card__value metric-card__value--flash">
          {{ displayValue }}
        </span>
        <Transition name="unit">
          <span v-if="displayUnit" :key="displayUnit" class="metric-card__unit">
            {{ displayUnit }}
          </span>
        </Transition>
      </div>
      <p v-if="directionLabel" class="metric-card__direction" aria-hidden="true">
        {{ directionLabel }}
      </p>
      <p class="metric-card__label" aria-hidden="true">
        {{ label }}
      </p>
    </template>
  </div>
</template>

<style scoped>
.metric-card {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  position: relative;
  /* overflow: hidden clips the ::before accent bar at the top corners,
     rounding it to match the card's border-radius. */
  overflow: hidden;
}

/* Accent bar — height and opacity scale with --metric-accent-h / --metric-accent-op.
   Transitions produce a smooth visual response as power changes between readings. */
.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: var(--metric-accent-h, 2px);
  background: var(--metric-accent, var(--color-home));
  opacity: var(--metric-accent-op, 0.6);
  transition: background 400ms ease, height 400ms ease, opacity 400ms ease;
}

/* Ambient background tint — uses the same concept colour at very low opacity
   (max 5%). Mirrors the InsightBlock::after pattern: atmosphere, not colour. */
.metric-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--metric-accent, transparent);
  opacity: var(--metric-bg-op, 0);
  pointer-events: none;
  transition: background 400ms ease, opacity 600ms ease;
}

.metric-card__value-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  margin-bottom: var(--space-1);
}

.metric-card__value {
  font-size: 1.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--color-text-primary);
  position: relative;
  z-index: 1;
}

/* Brief brightness pulse on each settled value change. Fires because :key
   binding forces element replacement, replaying the CSS animation. */
@media (prefers-reduced-motion: no-preference) {
  .metric-card__value--flash {
    animation: value-flash 120ms ease-out;
  }
}

@keyframes value-flash {
  0%   { filter: brightness(1.4); }
  100% { filter: brightness(1); }
}

.metric-card--unavailable .metric-card__value {
  color: var(--color-text-subdued);
}

.metric-card__unit {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  align-self: flex-end;
  padding-bottom: 2px;
  position: relative;
  z-index: 1;
}

/* Unit cross-fade when W → kW threshold is crossed. */
.unit-enter-active { transition: opacity 200ms ease-out; }
.unit-leave-active { transition: opacity 150ms ease-in; position: absolute; }
.unit-enter-from   { opacity: 0; }
.unit-leave-to     { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .unit-enter-active,
  .unit-leave-active { transition: none; }
}

/* Direction label picks up a tint from the accent colour so "Charging",
   "Importing", etc. are visually connected to the card's current state. */
.metric-card__direction {
  margin: 0 0 var(--space-1) 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: color-mix(in srgb, var(--metric-accent) 55%, var(--color-text-subdued) 45%);
  position: relative;
  z-index: 1;
}

.metric-card__label {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  position: relative;
  z-index: 1;
}

/* Screen-reader-only live region */
.metric-card__sr-announce {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Loading skeletons */
.metric-card--loading {
  pointer-events: none;
}

.metric-card__skeleton {
  border-radius: var(--radius-sm);
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
  .metric-card__skeleton {
    animation: none;
    background: var(--color-surface-raised);
  }
}

.metric-card__skeleton--value {
  height: 1.75rem;
  width: 60%;
  margin-bottom: var(--space-2);
}

.metric-card__skeleton--label {
  height: 0.875rem;
  width: 80%;
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
</style>
