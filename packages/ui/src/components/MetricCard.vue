<script setup lang="ts">
import { computed } from 'vue'
import { useAnimatedNumber } from '../composables/useAnimatedNumber.js'

interface Props {
  label: string
  value: number | null
  unit: string
  concept: 'solar' | 'battery' | 'grid' | 'home'
  directionLabel?: string
  isLoading?: boolean
}

const props = defineProps<Props>()

// Animated display value — smoothly counts between readings.
// The composable respects prefers-reduced-motion and cancels on unmount.
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

// The screen-reader announcement uses the *final* prop value, not the animated
// intermediate — screen readers should announce the settled number, not every frame.
const srValue = computed(() => {
  if (props.value === null) return `${props.label}: unavailable`
  return `${props.label}: ${formatValue(props.value, props.unit)} ${resolvedUnit(props.value, props.unit)}`
})

// Flash class fires when the value prop changes to give a brief brightness pulse.
// String-coerced so the key is always a valid PropertyKey (not null).
const flashKey = computed(() => String(props.value))
</script>

<template>
  <div
    class="metric-card"
    :class="[`metric-card--${concept}`, { 'metric-card--loading': isLoading, 'metric-card--unavailable': value === null && !isLoading }]"
  >
    <template v-if="isLoading">
      <div class="metric-card__skeleton metric-card__skeleton--value" aria-hidden="true" />
      <div class="metric-card__skeleton metric-card__skeleton--label" aria-hidden="true" />
    </template>
    <template v-else>
      <!-- Visually-hidden live region announces the final settled value,
           not intermediate animation frames. -->
      <span class="metric-card__sr-announce" aria-live="polite" aria-atomic="true">
        {{ srValue }}
      </span>

      <div class="metric-card__value-row" aria-hidden="true">
        <!-- The key forces the flash animation to replay on each value change. -->
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
  overflow: visible;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.metric-card--solar::before    { background: var(--color-solar); }
.metric-card--battery::before  { background: var(--color-battery-charging); }
.metric-card--grid::before     { background: var(--color-grid-import); }
.metric-card--home::before     { background: var(--color-home); }

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
}

/* Brief brightness pulse on each value update. GPU-composited via filter.
   The @keyframes fires because the :key binding forces element replacement. */
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
}

/* Unit cross-fade when W→kW threshold is crossed. */
.unit-enter-active { transition: opacity 200ms ease-out; }
.unit-leave-active { transition: opacity 150ms ease-in; position: absolute; }
.unit-enter-from   { opacity: 0; }
.unit-leave-to     { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .unit-enter-active,
  .unit-leave-active { transition: none; }
}

.metric-card__direction {
  margin: 0 0 var(--space-1) 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-subdued);
}

.metric-card__label {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

/* Screen-reader only live region — visually hidden but announced by screen readers */
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
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
