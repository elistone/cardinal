<script setup lang="ts">
import { computed } from 'vue'
import type { InsightSentiment, InsightConfidence } from '@cardinal/domain'

interface Props {
  title: string
  description: string
  detail?: string
  sentiment: InsightSentiment
  confidence: InsightConfidence
  isLoading?: boolean
}

const props = defineProps<Props>()

// Key changes when the insight content changes, triggering the cross-fade transition.
// Using title+description (not a random id) so the same insight rendered twice does
// not animate — only genuine content changes trigger the dissolve.
const contentKey = computed(() => `${props.title}__${props.description}`)
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

    <Transition v-else name="insight" mode="out-in">
      <div :key="contentKey" class="insight-block__content">
        <p v-if="confidence !== 'high'" class="insight-block__qualifier">
          Estimated
        </p>
        <!-- aria-live on the outer content div announces changes to screen readers
             without depending on the visual transition timing. -->
        <h2 class="insight-block__title" aria-live="polite">
          {{ title }}
        </h2>
        <p class="insight-block__description" aria-live="polite">
          {{ description }}
        </p>
        <p v-if="detail" class="insight-block__detail">
          {{ detail }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.insight-block {
  container-type: inline-size;
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border-left: 3px solid var(--color-neutral);
  position: relative;
  overflow: hidden;
  /* Sentiment colour transition is slower than the text dissolve so the accent
     persists briefly as a continuity cue while the new content arrives. */
  transition: border-left-color 400ms ease;
}

/* Faint gradient tint in the top-left corner, coloured by sentiment.
   At 4% opacity this is perceived as atmosphere rather than read as colour.
   The gradient fades to transparent at 60% so text contrast is unaffected. */
.insight-block::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  transition: opacity 400ms ease;
  opacity: 0;
}

.insight-block--positive::after {
  background: radial-gradient(ellipse at 0% 0%, rgba(16, 185, 129, 0.07) 0%, transparent 60%);
  opacity: 1;
}

.insight-block--negative::after {
  background: radial-gradient(ellipse at 0% 0%, rgba(239, 68, 68, 0.06) 0%, transparent 60%);
  opacity: 1;
}

.insight-block--neutral::after {
  opacity: 0;
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
  line-height: 1.2;
  color: var(--color-text-primary);
}

@container (min-width: 420px) {
  .insight-block__title {
    font-size: 1.875rem;
  }
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

/* ── Insight content cross-fade ─────────────────────────────────────────────
   out-in mode: old content fades + rises out, then new content fades + drops in.
   The slight vertical shift (6px) communicates "new information arriving".
   Timing: 180ms out + 220ms in — fast enough to feel responsive,
   slow enough to register as intentional.
*/
.insight-enter-active {
  transition: opacity 220ms ease-out, transform 220ms ease-out;
}
.insight-leave-active {
  transition: opacity 180ms ease-in, transform 180ms ease-in;
}
.insight-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.insight-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .insight-block {
    transition: none;
  }
  .insight-enter-active,
  .insight-leave-active {
    transition: none;
  }
  .insight-enter-from,
  .insight-leave-to {
    opacity: 1;
    transform: none;
  }
}

/* ── Loading skeletons ──────────────────────────────────────────────────── */
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
