<script setup lang="ts">
import type { SensorHealthStatus } from '@cardinal/domain'

interface Props {
  status: SensorHealthStatus
  label: string
  entityId?: string
}

defineProps<Props>()

const statusLabels: Record<SensorHealthStatus, string> = {
  configured: 'OK',
  missing: 'Not configured',
  unavailable: 'Unavailable',
  invalid: 'Invalid',
}
</script>

<template>
  <div
    class="sensor-health-badge"
    :class="`sensor-health-badge--${status}`"
    :aria-label="`${label}: ${statusLabels[status]}`"
  >
    <span class="sensor-health-badge__dot" aria-hidden="true" />
    <span class="sensor-health-badge__concept">{{ label }}</span>
    <span class="sensor-health-badge__status">{{ statusLabels[status] }}</span>
    <span v-if="entityId" class="sensor-health-badge__entity">{{ entityId }}</span>
  </div>
</template>

<style scoped>
.sensor-health-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 0.8125rem;
}

.sensor-health-badge__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sensor-health-badge--configured .sensor-health-badge__dot {
  background: var(--color-health-configured);
}

.sensor-health-badge--missing .sensor-health-badge__dot {
  background: var(--color-health-missing);
}

.sensor-health-badge--unavailable .sensor-health-badge__dot {
  background: var(--color-health-unavailable);
}

.sensor-health-badge--invalid .sensor-health-badge__dot {
  background: var(--color-health-invalid);
}

.sensor-health-badge__concept {
  font-weight: 500;
  color: var(--color-text-primary);
}

.sensor-health-badge__status {
  color: var(--color-text-secondary);
}

.sensor-health-badge--missing .sensor-health-badge__status {
  color: var(--color-health-missing);
}

.sensor-health-badge--unavailable .sensor-health-badge__status {
  color: var(--color-health-unavailable);
}

.sensor-health-badge--invalid .sensor-health-badge__status {
  color: var(--color-health-invalid);
}

.sensor-health-badge__entity {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--color-text-subdued);
  background: var(--color-surface-raised);
  padding: 1px var(--space-2);
  border-radius: 3px;
}
</style>
