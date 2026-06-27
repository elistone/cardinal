import { ref, computed, onUnmounted } from 'vue'
import type { ShowroomScene } from '../showroom/scenes.js'

export interface ShowroomState {
  readonly snapshot: ReturnType<typeof computed>
  readonly insight: ReturnType<typeof computed>
  readonly sceneLabel: ReturnType<typeof computed>
  readonly sceneTime: ReturnType<typeof computed>
  readonly sceneIndex: ReturnType<typeof computed>
  readonly totalScenes: number
}

export function useShowroomMode(scenes: ShowroomScene[]) {
  const index = ref(0)

  const scene = computed(() => scenes[index.value]!)

  let timer: ReturnType<typeof setTimeout> | null = null

  function scheduleNext() {
    timer = setTimeout(() => {
      index.value = (index.value + 1) % scenes.length
      scheduleNext()
    }, scene.value.durationMs)
  }

  scheduleNext()

  onUnmounted(() => {
    if (timer !== null) clearTimeout(timer)
  })

  return {
    snapshot: computed(() => scene.value.snapshot),
    insight: computed(() => scene.value.insight),
    sceneLabel: computed(() => scene.value.label),
    sceneTime: computed(() => scene.value.time),
    sceneIndex: computed(() => index.value),
    totalScenes: scenes.length,
  }
}
