<script setup lang="ts">
import type { EnergySnapshot, EnergyInsight } from '@cardinal/domain'
import { NowPanel } from '@cardinal/ui'

interface Props {
  snapshot: EnergySnapshot | null
  insight: EnergyInsight | null
}

defineProps<Props>()
</script>

<template>
  <div class="state-disconnected">
    <div class="reconnecting-banner" role="status">
      <span class="reconnecting-banner__dot" aria-hidden="true" />
      Reconnecting to Home Assistant…
    </div>

    <template v-if="snapshot && insight">
      <!-- Stale data: aria-hidden because values are not current -->
      <div class="state-disconnected__stale" aria-hidden="true">
        <NowPanel :snapshot="snapshot" :insight="insight" />
      </div>
    </template>

    <template v-else>
      <p class="state-disconnected__no-data">Waiting for data after reconnection.</p>
    </template>
  </div>
</template>

<style scoped>
.state-disconnected {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reconnecting-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: rgba(245, 158, 11, 0.08);
  border-bottom: 1px solid rgba(245, 158, 11, 0.15);
  font-size: 0.875rem;
  color: var(--color-health-unavailable);
  flex-shrink: 0;
}

.reconnecting-banner__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-health-unavailable);
  flex-shrink: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .reconnecting-banner__dot {
    animation: none;
    opacity: 0.6;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.state-disconnected__stale {
  flex: 1;
  display: flex;
  flex-direction: column;
  opacity: 0.5;
  pointer-events: none;
  overflow: hidden;
}

.state-disconnected__no-data {
  margin: var(--space-6);
  color: var(--color-text-subdued);
  font-size: 0.875rem;
}
</style>
