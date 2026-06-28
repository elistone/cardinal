<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  isLive: boolean
  currentTime: Date | null
  dayStart: Date | null
  dayEnd: Date | null
  waveform?: readonly number[]
}

const props = withDefaults(defineProps<Props>(), {
  currentTime: null,
  dayStart: null,
  dayEnd: null,
})

const emit = defineEmits<{
  seek: [timestamp: Date]
  goLive: []
}>()

const interactiveRef = ref<HTMLDivElement | null>(null)
const seeking = ref(false)

const dayStartMs = computed<number>(() =>
  props.dayStart?.getTime() ?? (Date.now() - 12 * 3_600_000),
)

const dayDurationMs = computed<number>(() => {
  if (props.dayEnd) return props.dayEnd.getTime() - dayStartMs.value
  return 24 * 3_600_000
})

const progressFraction = computed<number>(() => {
  if (props.isLive) return 1.0
  if (!props.currentTime || !props.dayStart) return 0
  return Math.max(
    0,
    Math.min(1, (props.currentTime.getTime() - dayStartMs.value) / dayDurationMs.value),
  )
})

const currentMinute = computed<number>(() => Math.round(progressFraction.value * 1439))

const progressPercent = computed<string>(() => (progressFraction.value * 100).toFixed(3) + '%')

const formattedTime = computed<string>(() => {
  if (!props.currentTime) return ''
  return props.currentTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

const ariaValueText = computed<string>(() =>
  props.isLive ? 'Live' : (formattedTime.value || 'Not started'),
)

// SVG area path representing the solar waveform.
// viewBox: 0 0 120 32 — 120 buckets, 32 units tall, bars grow upward.
const waveformPath = computed<string>(() => {
  const w = props.waveform
  if (!w || w.length === 0) return ''
  const n = w.length
  const H = 32
  const pts = w
    .map((v, i) => {
      const x = ((i / n) * 120).toFixed(2)
      const y = (H - Math.max(0, Math.min(1, v)) * (H - 2)).toFixed(2)
      return `${x},${y}`
    })
    .join(' L')
  return `M0,${H} L${pts} L120,${H} Z`
})

function fractionFromPointer(e: PointerEvent): number {
  if (!interactiveRef.value) return 0
  const rect = interactiveRef.value.getBoundingClientRect()
  return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
}

function seekToFraction(fraction: number): void {
  // Dragging to the last ~0.5% triggers live mode, matching the "far right = LIVE" principle.
  if (fraction >= 0.995) {
    emit('goLive')
    return
  }
  const ts = new Date(dayStartMs.value + fraction * dayDurationMs.value)
  emit('seek', ts)
}

function onPointerDown(e: PointerEvent): void {
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  seeking.value = true
  seekToFraction(fractionFromPointer(e))
}

function onPointerMove(e: PointerEvent): void {
  if (!seeking.value) return
  seekToFraction(fractionFromPointer(e))
}

function onPointerUp(e: PointerEvent): void {
  ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  seeking.value = false
}

function onKeyDown(e: KeyboardEvent): void {
  const step = e.shiftKey ? 15 : 1
  let minute = currentMinute.value

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault()
      minute = Math.max(0, minute - step)
      break
    case 'ArrowRight': {
      e.preventDefault()
      const next = minute + step
      if (next >= 1439) {
        emit('goLive')
        return
      }
      minute = next
      break
    }
    case 'Home':
      e.preventDefault()
      minute = 0
      break
    case 'End':
    case 'Escape':
      e.preventDefault()
      emit('goLive')
      return
    default:
      return
  }

  const ts = new Date(dayStartMs.value + minute * 60_000)
  emit('seek', ts)
}
</script>

<template>
  <div class="timeline-bar" :class="{ 'timeline-bar--historical': !isLive }">
    <!-- Track -->
    <div class="timeline-bar__track-wrapper">
      <!-- Solar waveform: subtle amber fill showing where solar activity occurred -->
      <svg
        class="timeline-bar__waveform"
        viewBox="0 0 120 32"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path v-if="waveformPath" :d="waveformPath" class="timeline-bar__waveform-path" />
      </svg>

      <!-- Played region: faint tint from midnight to current position -->
      <div class="timeline-bar__fill" :style="{ width: progressPercent }" />

      <!-- Playhead: sharp vertical line at current time -->
      <div
        class="timeline-bar__playhead"
        :class="{ 'timeline-bar__playhead--live': isLive }"
        :style="{ left: progressPercent }"
        aria-hidden="true"
      />

      <!-- Interactive overlay — slider semantics for assistive technologies -->
      <div
        ref="interactiveRef"
        class="timeline-bar__interactive"
        role="slider"
        :aria-valuenow="currentMinute"
        aria-valuemin="0"
        aria-valuemax="1439"
        :aria-valuetext="ariaValueText"
        aria-label="Timeline — scrub through today's energy history. Arrow keys to move, Escape to return to live."
        tabindex="0"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @keydown="onKeyDown"
      />
    </div>

    <!-- Footer: start label, current time (in historical mode), live label/button -->
    <div class="timeline-bar__footer">
      <span class="timeline-bar__time-label">00:00</span>

      <span v-if="!isLive && formattedTime" class="timeline-bar__time-current">
        {{ formattedTime }}
      </span>

      <!-- In historical mode: clickable LIVE button to return to live -->
      <button
        v-if="!isLive"
        class="timeline-bar__live-btn"
        aria-label="Return to live"
        @click="emit('goLive')"
      >
        <span class="timeline-bar__live-dot" aria-hidden="true" />
        LIVE
      </button>

      <!-- In live mode: breathing LIVE label (not interactive) -->
      <span v-else class="timeline-bar__live-label" aria-hidden="true">
        <span class="timeline-bar__live-dot timeline-bar__live-dot--breathing" />
        LIVE
      </span>
    </div>
  </div>
</template>

<style scoped>
.timeline-bar {
  padding: var(--space-3) var(--space-6) var(--space-2);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
  user-select: none;
}

/* ── Track ─────────────────────────────────────────────────────────────── */

.timeline-bar__track-wrapper {
  position: relative;
  height: 32px;
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

/* Waveform SVG — stretches to fill the track */
.timeline-bar__waveform {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.timeline-bar__waveform-path {
  fill: var(--color-solar);
  opacity: 0.18;
}

/* Tint the region from midnight to the playhead */
.timeline-bar__fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.03);
  pointer-events: none;
  transition: width 80ms linear;
}

.timeline-bar--historical .timeline-bar__fill {
  background: rgba(255, 255, 255, 0.055);
}

/* The playhead — 2px line at the current position */
.timeline-bar__playhead {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: rgba(255, 255, 255, 0.65);
  transform: translateX(-1px);
  pointer-events: none;
  transition: left 80ms linear;
}

/* Live playhead glows green */
.timeline-bar__playhead--live {
  background: var(--color-positive);
  box-shadow: 0 0 8px var(--color-positive);
}

/* Interactive overlay — covers the track, captures all pointer/keyboard input */
.timeline-bar__interactive {
  position: absolute;
  inset: 0;
  cursor: crosshair;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.timeline-bar__interactive:focus-visible {
  outline: 2px solid var(--color-positive);
  outline-offset: -2px;
  border-radius: var(--radius-sm);
}

/* ── Footer ─────────────────────────────────────────────────────────────── */

.timeline-bar__footer {
  display: flex;
  align-items: center;
  margin-top: var(--space-2);
  font-size: 0.6875rem;
  color: var(--color-text-subdued);
  letter-spacing: 0;
}

.timeline-bar__time-label {
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.timeline-bar__time-current {
  flex: 1;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.timeline-bar__live-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: var(--space-1) var(--space-3);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-subdued);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.timeline-bar__live-btn:hover {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-positive);
  border-color: rgba(16, 185, 129, 0.3);
}

.timeline-bar__live-label {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-positive);
  font-weight: 700;
  letter-spacing: 0.06em;
  font-size: 0.6875rem;
}

.timeline-bar__live-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.timeline-bar__live-dot--breathing {
  animation: timeline-live-breath 3s ease-in-out infinite;
  animation-play-state: var(--cardinal-animation-play-state, running);
}

@keyframes timeline-live-breath {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

/* ── Reduced motion ──────────────────────────────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  .timeline-bar__playhead,
  .timeline-bar__fill {
    transition: none;
  }

  .timeline-bar__live-dot--breathing {
    animation: none;
  }
}
</style>
