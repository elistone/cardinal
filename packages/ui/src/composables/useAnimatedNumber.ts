import { ref, watch, onUnmounted } from 'vue'

// Duration is deliberately short (200ms): long enough to register as "live data
// updating" but short enough that it never delays comprehension.
const DURATION_MS = 200

// Respect the user's OS-level reduced-motion preference. When active, we skip
// the animation entirely and jump to the target value immediately.
// Guard for test environments (jsdom) where matchMedia may not be available.
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Ease-out: fast start, gentle finish. Mirrors the physical feeling of something
// settling into a new value rather than counting mechanically.
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function useAnimatedNumber(getValue: () => number | null) {
  const displayed = ref<number | null>(null)
  let rafId: number | null = null
  let startTime: number | null = null
  let fromValue = 0
  let toValue = 0

  function cancelAnimation() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function animate(now: number) {
    if (startTime === null) startTime = now
    const elapsed = now - startTime
    const t = Math.min(elapsed / DURATION_MS, 1)

    displayed.value = fromValue + (toValue - fromValue) * easeOut(t)

    if (t < 1) {
      rafId = requestAnimationFrame(animate)
    } else {
      displayed.value = toValue
      rafId = null
      startTime = null
    }
  }

  watch(getValue, (newVal) => {
    if (newVal === null) {
      cancelAnimation()
      displayed.value = null
      return
    }

    if (prefersReducedMotion() || displayed.value === null) {
      cancelAnimation()
      displayed.value = newVal
      return
    }

    cancelAnimation()
    fromValue = displayed.value
    toValue = newVal
    startTime = null
    rafId = requestAnimationFrame(animate)
  }, { immediate: true })

  onUnmounted(cancelAnimation)

  return displayed
}
