<script setup lang="ts">
interface Props {
  label: string
  value: number | null
  unit: string
  concept: 'solar' | 'battery' | 'grid' | 'home'
  directionLabel?: string
  isLoading?: boolean
}

const props = defineProps<Props>()

function formatValue(value: number, unit: string): string {
  if (unit === 'kW' || unit === 'W') {
    if (value >= 1000) {
      return (value / 1000).toFixed(1)
    }
    return value.toFixed(0)
  }
  return value.toFixed(1)
}

function resolvedUnit(value: number, unit: string): string {
  if ((unit === 'kW' || unit === 'W') && value >= 1000) return 'kW'
  if ((unit === 'kW' || unit === 'W') && value < 1000) return 'W'
  return unit
}

const displayValue = () => {
  if (props.value === null) return '—'
  return formatValue(props.value, props.unit)
}

const displayUnit = () => {
  if (props.value === null) return ''
  return resolvedUnit(props.value, props.unit)
}
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
      <div class="metric-card__value-row">
        <span class="metric-card__value" aria-live="polite">{{ displayValue() }}</span>
        <span v-if="displayUnit()" class="metric-card__unit">{{ displayUnit() }}</span>
      </div>
      <p v-if="directionLabel" class="metric-card__direction">
        {{ directionLabel }}
      </p>
      <p class="metric-card__label">
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
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.metric-card--solar::before { background: var(--color-solar); }
.metric-card--battery::before { background: var(--color-battery-charging); }
.metric-card--grid::before { background: var(--color-grid-import); }
.metric-card--home::before { background: var(--color-home); }

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

.metric-card__direction {
  margin: 0 0 var(--space-1) 0;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-subdued);
}

.metric-card__label {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
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
