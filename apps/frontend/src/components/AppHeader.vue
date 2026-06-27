<script setup lang="ts">
import type { ConfigurationHealth, SensorHealthStatus } from '@cardinal/domain'
import { LiveIndicator } from '@cardinal/ui'

interface Props {
  health: ConfigurationHealth | null
  isDisconnected: boolean
  showDiagnostics: boolean
  lastUpdated?: Date | null
}

const props = withDefaults(defineProps<Props>(), {
  lastUpdated: null,
})

defineEmits<{ openHealth: []; toggleDiagnostics: [] }>()

function overallStatus(health: ConfigurationHealth): SensorHealthStatus {
  const statuses = [
    ...Object.values(health.live),
    ...Object.values(health.daily),
  ].map((c) => c.status)

  if (statuses.some((s) => s === 'invalid')) return 'invalid'
  if (statuses.some((s) => s === 'unavailable')) return 'unavailable'
  if (statuses.some((s) => s === 'missing')) return 'missing'
  return 'configured'
}

const statusColors: Record<SensorHealthStatus, string> = {
  configured: 'var(--color-health-configured)',
  missing: 'var(--color-health-missing)',
  unavailable: 'var(--color-health-unavailable)',
  invalid: 'var(--color-health-invalid)',
}
</script>

<template>
  <header class="app-header">
    <span class="app-header__wordmark">Cardinal</span>

    <div class="app-header__actions">
      <!-- LIVE indicator: shown when connected and data has arrived.
           Fades out and the reconnecting badge appears when connection is lost. -->
      <LiveIndicator
        v-if="!isDisconnected"
        :last-updated="lastUpdated"
      />

      <span v-if="isDisconnected" class="app-header__disconnected-badge">
        Reconnecting…
      </span>

      <button
        v-if="health"
        class="app-header__health-btn"
        :aria-label="`Sensor health — ${overallStatus(health)}`"
        @click="$emit('openHealth')"
      >
        <span
          class="app-header__health-dot"
          :style="{ background: statusColors[overallStatus(health)] }"
          aria-hidden="true"
        />
        <span class="app-header__health-label">Sensors</span>
      </button>

      <button
        class="app-header__diag-btn"
        :class="{ 'app-header__diag-btn--active': showDiagnostics }"
        :aria-label="showDiagnostics ? 'Hide diagnostics' : 'Show diagnostics'"
        :aria-pressed="showDiagnostics"
        title="Developer diagnostics"
        @click="$emit('toggleDiagnostics')"
      >⚙</button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.app-header__wordmark {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.app-header__disconnected-badge {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-health-unavailable);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
}

.app-header__health-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}

.app-header__health-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.app-header__health-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.app-header__health-label {
  display: none;
}

@media (min-width: 480px) {
  .app-header__health-label {
    display: inline;
  }
}

.app-header__diag-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-subdued);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
}

.app-header__diag-btn:hover {
  background: var(--color-surface-raised);
  color: var(--color-text-secondary);
}

.app-header__diag-btn--active {
  background: var(--color-surface-raised);
  border-color: rgba(255, 255, 255, 0.15);
  color: var(--color-text-primary);
}
</style>
