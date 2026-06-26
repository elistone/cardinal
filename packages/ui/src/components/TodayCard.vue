<script setup lang="ts">
interface Props {
  label: string
  valueKwh: number | null
  isLoading?: boolean
}

const props = defineProps<Props>()

const displayValue = () => {
  if (props.valueKwh === null) return '—'
  return props.valueKwh.toFixed(1)
}
</script>

<template>
  <div
    class="today-card"
    :class="{ 'today-card--loading': isLoading, 'today-card--unavailable': valueKwh === null && !isLoading }"
  >
    <template v-if="isLoading">
      <div class="today-card__skeleton today-card__skeleton--value" aria-hidden="true" />
      <div class="today-card__skeleton today-card__skeleton--label" aria-hidden="true" />
    </template>
    <template v-else>
      <div class="today-card__value-row">
        <span class="today-card__value">{{ displayValue() }}</span>
        <span v-if="valueKwh !== null" class="today-card__unit">kWh</span>
      </div>
      <p class="today-card__label">{{ label }}</p>
    </template>
  </div>
</template>

<style scoped>
.today-card {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.today-card__value-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  margin-bottom: var(--space-1);
}

.today-card__value {
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--color-text-primary);
}

.today-card--unavailable .today-card__value {
  color: var(--color-text-subdued);
}

.today-card__unit {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  align-self: flex-end;
  padding-bottom: 2px;
}

.today-card__label {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

/* Loading skeletons */
.today-card--loading {
  pointer-events: none;
}

.today-card__skeleton {
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
  .today-card__skeleton {
    animation: none;
    background: var(--color-surface-raised);
  }
}

.today-card__skeleton--value {
  height: 1.5rem;
  width: 55%;
  margin-bottom: var(--space-2);
}

.today-card__skeleton--label {
  height: 0.8125rem;
  width: 75%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
