<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import type { ConfigurationHealth, SensorHealthStatus } from '@cardinal/domain'
import SensorHealthBadge from './SensorHealthBadge.vue'

interface Props {
  health: ConfigurationHealth
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const overlayEl = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLElement | null>(null)

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      await nextTick()
      closeBtn.value?.focus()
      document.addEventListener('keydown', onKeydown)
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
)

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

interface SensorRow {
  concept: string
  status: SensorHealthStatus
  entityId?: string
  value?: number | null
  unit?: string | null
}

function row(concept: string, h: { status: SensorHealthStatus; entityId?: string; value?: number | null; unit?: string | null }): SensorRow {
  return { concept, status: h.status, entityId: h.entityId, value: h.value, unit: h.unit }
}

function buildRows(health: ConfigurationHealth): SensorRow[] {
  const { live, daily } = health
  return [
    row('Solar power',            live.solar),
    row('Battery charging',       live.batteryCharging),
    row('Battery discharging',    live.batteryDischarging),
    row('Battery level',          live.batteryLevel),
    row('Grid import',            live.gridImport),
    row('Grid export',            live.gridExport),
    row('Home consumption',       live.homeConsumption),
    row('Solar generated today',  daily.solarGenerated),
    row('Battery charged today',  daily.batteryCharged),
    row('Battery discharged today', daily.batteryDischarged),
    row('Grid imported today',    daily.gridImported),
    row('Grid exported today',    daily.gridExported),
    row('Home consumed today',    daily.homeConsumed),
  ]
}
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="isOpen"
        class="overlay-backdrop"
        aria-hidden="true"
        @click="emit('close')"
      />
    </Transition>
    <Transition name="panel">
      <div
        v-if="isOpen"
        ref="overlayEl"
        class="sensor-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Sensor health"
      >
        <div class="sensor-overlay__header">
          <h2 class="sensor-overlay__title">Sensor Health</h2>
          <button
            ref="closeBtn"
            class="sensor-overlay__close"
            aria-label="Close sensor health"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <div class="sensor-overlay__body">
          <section class="sensor-overlay__section">
            <h3 class="sensor-overlay__section-title">Live sensors</h3>
            <ul class="sensor-overlay__list">
              <li
                v-for="row in buildRows(health).slice(0, 7)"
                :key="row.concept"
                class="sensor-overlay__item"
              >
                <SensorHealthBadge
                  :status="row.status"
                  :label="row.concept"
                  :entity-id="row.entityId"
                  :value="row.value"
                  :unit="row.unit"
                />
              </li>
            </ul>
          </section>

          <section class="sensor-overlay__section">
            <h3 class="sensor-overlay__section-title">Daily sensors</h3>
            <ul class="sensor-overlay__list">
              <li
                v-for="row in buildRows(health).slice(7)"
                :key="row.concept"
                class="sensor-overlay__item"
              >
                <SensorHealthBadge
                  :status="row.status"
                  :label="row.concept"
                  :entity-id="row.entityId"
                  :value="row.value"
                  :unit="row.unit"
                />
              </li>
            </ul>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay-backdrop {
  position: fixed;
  inset: 0;
  background: var(--color-surface-overlay);
  z-index: 100;
}

.sensor-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 480px;
  background: var(--color-surface-raised);
  border-left: 1px solid var(--color-border);
  z-index: 101;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sensor-overlay__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.sensor-overlay__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.sensor-overlay__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 150ms ease;
}

.sensor-overlay__close:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.sensor-overlay__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.sensor-overlay__section-title {
  margin: 0 0 var(--space-3) 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-subdued);
}

.sensor-overlay__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sensor-overlay__item {
  display: block;
}

.sensor-overlay__item .sensor-health-badge {
  width: 100%;
}

/* Transitions */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 200ms ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.panel-enter-active,
.panel-leave-active {
  transition: transform 250ms ease;
}

.panel-enter-from,
.panel-leave-to {
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .overlay-enter-active,
  .overlay-leave-active,
  .panel-enter-active,
  .panel-leave-active {
    transition: opacity 150ms ease;
  }

  .panel-enter-from,
  .panel-leave-to {
    transform: none;
    opacity: 0;
  }
}
</style>
