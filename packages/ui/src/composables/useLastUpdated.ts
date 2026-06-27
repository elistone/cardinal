import { ref, computed, watchEffect, onUnmounted } from 'vue'

function formatRelative(diffMs: number): string {
  const s = Math.floor(diffMs / 1000)
  if (s < 5)  return 'Updated just now'
  if (s < 60) return `Updated ${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `Updated ${m}m ago`
  return `Updated ${Math.floor(m / 60)}h ago`
}

export function useLastUpdated(getTimestamp: () => Date | null) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  watchEffect(() => {
    const ts = getTimestamp()
    if (ts && !timer) {
      timer = setInterval(() => { now.value = Date.now() }, 1000)
    } else if (!ts && timer) {
      clearInterval(timer)
      timer = null
    }
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return computed(() => {
    const ts = getTimestamp()
    if (!ts) return ''
    return formatRelative(now.value - ts.getTime())
  })
}
