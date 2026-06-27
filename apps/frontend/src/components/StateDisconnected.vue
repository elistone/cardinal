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
    <!-- Banner slides down from above when disconnection is detected.
         The amber pulse dot draws attention without alarming. -->
    <div class="reconnecting-banner" role="status">
      <span class="reconnecting-banner__dot" aria-hidden="true" />
      Reconnecting to Home Assistant…
    </div>

    <template v-if="snapshot && insight">
      <!-- Stale data is dimmed so the user can see what was last known
           while clearly understanding it is not current.
           aria-hidden because the values may no longer be accurate. -->
      <div class="state-disconnected__stale" aria-hidden="true">
        <NowPanel :snapshot="snapshot" :insight="insight" />
      </div>
    </template>

    <template v-else>
      <p class="state-disconnected__no-data">Waiting for your home's data to arrive.</p>
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

/* Banner slides down when StateDisconnected enters the DOM.
   animation-fill-mode: both means the element starts in its from state,
   so there is no flash of unstyled content before the animation runs. */
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
  animation: banner-slide-in 250ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .reconnecting-banner {
    animation: none;
  }
}

@keyframes banner-slide-in {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

/* Stale content transitions from full opacity to dimmed over 600ms.
   Slow by design: a sudden dim looks like an error.
   A gradual dim feels like the system catching its breath. */
.state-disconnected__stale {
  flex: 1;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.5;
  animation: dim-in 600ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .state-disconnected__stale {
    animation: none;
  }
}

@keyframes dim-in {
  from { opacity: 1; }
  to   { opacity: 0.5; }
}

.state-disconnected__no-data {
  margin: var(--space-6);
  color: var(--color-text-subdued);
  font-size: 0.875rem;
}
</style>
