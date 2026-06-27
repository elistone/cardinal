<script setup lang="ts">
interface Props {
  savedAmount: number | null
  earnedAmount: number | null
  currency: string
  isLoading?: boolean
}

const props = defineProps<Props>()

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const netBenefit = () => {
  if (props.savedAmount === null || props.earnedAmount === null) return null
  return props.savedAmount + props.earnedAmount
}

const isUnavailable = () =>
  !props.isLoading && (props.savedAmount === null || props.earnedAmount === null)
</script>

<template>
  <div
    class="financial-summary"
    :class="{ 'financial-summary--loading': isLoading, 'financial-summary--unavailable': isUnavailable() }"
    aria-label="Today's financial summary"
  >
    <template v-if="isLoading">
      <div v-for="i in 3" :key="i" class="financial-summary__skeleton-row">
        <div class="financial-summary__skeleton financial-summary__skeleton--label" aria-hidden="true" />
        <div class="financial-summary__skeleton financial-summary__skeleton--value" aria-hidden="true" />
      </div>
    </template>
    <template v-else-if="isUnavailable()">
      <p class="financial-summary__unavailable">
        To show savings, add your electricity rates in Settings → Cardinal.
      </p>
    </template>
    <template v-else>
      <div class="financial-summary__row">
        <span class="financial-summary__label">Saved</span>
        <span class="financial-summary__value financial-summary__value--savings" aria-live="polite">
          {{ formatAmount(savedAmount!, currency) }}
        </span>
      </div>
      <div class="financial-summary__row">
        <span class="financial-summary__label">Export earnings</span>
        <span class="financial-summary__value financial-summary__value--earnings" aria-live="polite">
          {{ formatAmount(earnedAmount!, currency) }}
        </span>
      </div>
      <div class="financial-summary__row financial-summary__row--total">
        <span class="financial-summary__label financial-summary__label--total">Net benefit</span>
        <span class="financial-summary__value financial-summary__value--total" aria-live="polite">
          {{ formatAmount(netBenefit()!, currency) }}
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.financial-summary {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.financial-summary__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) 0;
}

.financial-summary__row + .financial-summary__row {
  border-top: 1px solid var(--color-border);
}

.financial-summary__row--total {
  border-top: 1px solid rgba(255, 255, 255, 0.15) !important;
  margin-top: var(--space-1);
  padding-top: var(--space-3);
}

.financial-summary__label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.financial-summary__label--total {
  font-weight: 600;
  color: var(--color-text-primary);
}

.financial-summary__value {
  font-size: 0.9375rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.financial-summary__value--savings { color: var(--color-savings); }
.financial-summary__value--earnings { color: var(--color-earnings); }
.financial-summary__value--total { color: var(--color-text-primary); }

.financial-summary__unavailable {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-subdued);
  line-height: 1.5;
}

/* Loading skeletons */
.financial-summary--loading {
  pointer-events: none;
}

.financial-summary__skeleton-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) 0;
  border-top: 1px solid var(--color-border);
}

.financial-summary__skeleton-row:first-child {
  border-top: none;
}

.financial-summary__skeleton {
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
  .financial-summary__skeleton {
    animation: none;
    background: var(--color-surface-raised);
  }
}

.financial-summary__skeleton--label {
  height: 0.875rem;
  width: 120px;
}

.financial-summary__skeleton--value {
  height: 0.9375rem;
  width: 70px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
