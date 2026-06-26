<script setup lang="ts">
import type { InsightSentiment, InsightConfidence } from '@cardinal/domain'

interface Props {
  title: string
  description: string
  detail?: string
  sentiment: InsightSentiment
  confidence: InsightConfidence
  isLoading?: boolean
}

defineProps<Props>()
</script>

<template>
  <div
    class="insight-block"
    :class="[`insight-block--${sentiment}`, { 'insight-block--loading': isLoading }]"
    aria-label="Energy insight"
  >
    <template v-if="isLoading">
      <div class="insight-block__skeleton insight-block__skeleton--title" aria-hidden="true" />
      <div class="insight-block__skeleton insight-block__skeleton--desc" aria-hidden="true" />
      <div class="insight-block__skeleton insight-block__skeleton--desc-short" aria-hidden="true" />
    </template>
    <template v-else>
      <p v-if="confidence !== 'high'" class="insight-block__qualifier">
        Estimated
      </p>
      <h2 class="insight-block__title" aria-live="polite">
        {{ title }}
      </h2>
      <p class="insight-block__description" aria-live="polite">
        {{ description }}
      </p>
      <p v-if="detail" class="insight-block__detail">
        {{ detail }}
      </p>
    </template>
  </div>
</template>

<style scoped>
.insight-block {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border-left: 3px solid var(--color-neutral);
}

.insight-block--positive {
  border-left-color: var(--color-positive);
}

.insight-block--negative {
  border-left-color: var(--color-negative);
}

.insight-block--neutral {
  border-left-color: var(--color-neutral);
}

.insight-block__qualifier {
  margin: 0 0 var(--space-2) 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-subdued);
}

.insight-block__title {
  margin: 0 0 var(--space-3) 0;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-text-primary);
}

.insight-block__description {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.insight-block__detail {
  margin: var(--space-3) 0 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text-subdued);
}

/* Loading skeletons */
.insight-block--loading {
  pointer-events: none;
}

.insight-block__skeleton {
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
  .insight-block__skeleton {
    animation: none;
    background: var(--color-surface-raised);
  }
}

.insight-block__skeleton--title {
  height: 1.75rem;
  width: 70%;
  margin-bottom: var(--space-3);
}

.insight-block__skeleton--desc {
  height: 1rem;
  width: 90%;
  margin-bottom: var(--space-2);
}

.insight-block__skeleton--desc-short {
  height: 1rem;
  width: 60%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
