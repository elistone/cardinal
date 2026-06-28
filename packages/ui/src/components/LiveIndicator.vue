<script setup lang="ts">
import { useLastUpdated } from '../composables/useLastUpdated.js'

interface Props {
  lastUpdated: Date | null
}

const props = defineProps<Props>()

const lastUpdatedText = useLastUpdated(() => props.lastUpdated)
</script>

<template>
  <div
    v-if="lastUpdated !== null"
    class="live-indicator"
    role="status"
    aria-label="Connection status: live"
    aria-live="off"
  >
    <span class="live-indicator__dot" aria-hidden="true" />
    <span class="live-indicator__label">LIVE</span>
    <span v-if="lastUpdatedText" class="live-indicator__time">
      {{ lastUpdatedText }}
    </span>
  </div>
</template>

<style scoped>
.live-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
}

/* Breathing green dot — calm, not urgent.
   Breath cycle is 3s: much slower than typical "loading" pulses.
   Opacity never drops below 0.5 so it never looks like it's off. */
.live-indicator__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-positive);
  flex-shrink: 0;
  animation: live-breath 3s ease-in-out infinite;
  animation-play-state: var(--cardinal-animation-play-state, running);
}

@media (prefers-reduced-motion: reduce) {
  .live-indicator__dot {
    animation: none;
  }
}

@keyframes live-breath {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}

.live-indicator__label {
  color: var(--color-positive);
  text-transform: uppercase;
}

.live-indicator__time {
  color: var(--color-text-subdued);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}
</style>
