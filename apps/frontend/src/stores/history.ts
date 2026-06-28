import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailyFinancials, DailySummary, EnergyInsight, EnergySnapshot } from '@cardinal/domain'
import type { TimeMode } from '@cardinal/domain'
import { buildDailyFinancials, describeEnergyState } from '@cardinal/core'
import { useEnergyStore } from './energy'

/**
 * The history store.
 *
 * This store is the single authoritative source for the data currently on
 * screen. It owns:
 *
 *   currentSnapshot      — what every component renders from
 *   currentDailySummary  — the TODAY section's source of truth
 *   currentInsight       — the explanation derived from currentSnapshot
 *   currentDailyFinancials — the financial summary derived from currentDailySummary
 *
 * In live mode, current* values are the live provider's latest data.
 * In historical mode, they are the snapshot retrieved for the selected time.
 *
 * Components must never read latestSnapshot from useEnergyStore directly.
 * They receive currentSnapshot (via props or this store) and render
 * identically regardless of origin.
 *
 * Architecture invariant:
 *   historyStore → energyStore  (one direction only, no cycles)
 */
export const useHistoryStore = defineStore('history', () => {
  const energyStore = useEnergyStore()

  // ── Mode ──────────────────────────────────────────────────────────────────

  const mode = ref<TimeMode>('live')

  /**
   * The timestamp the user has selected when in historical mode.
   * Null in live mode.
   */
  const selectedTimestamp = ref<Date | null>(null)

  // ── Historical data ───────────────────────────────────────────────────────

  const historicalSnapshot = ref<EnergySnapshot | null>(null)
  const historicalDailySummary = ref<DailySummary | null>(null)

  /**
   * Whether historical data is available for this installation.
   *
   * Placeholder: defaults to false. Set by the historical provider once it
   * has assessed what data is available. The timeline UI reads this before
   * showing the scrubber.
   */
  const isHistoricalAvailable = ref<boolean>(false)

  /**
   * The state of any in-progress replay.
   *
   * Placeholder: replay is not implemented yet. Present now so that the API
   * is complete and the timeline UI can drive it without architectural change.
   */
  const replayState = ref<'idle' | 'playing' | 'paused'>('idle')

  // ── Derived: current values ───────────────────────────────────────────────

  /**
   * The snapshot currently displayed to the user.
   *
   * Live mode:       energyStore.latestSnapshot
   * Historical mode: historicalSnapshot (fetched for the selected timestamp)
   *
   * All components that render energy data must read from here, never from
   * energyStore.latestSnapshot.
   */
  const currentSnapshot = computed<EnergySnapshot | null>(() =>
    mode.value === 'live' ? energyStore.latestSnapshot : historicalSnapshot.value,
  )

  /**
   * The daily summary currently displayed to the user.
   *
   * Live mode:       energyStore.latestDailySummary
   * Historical mode: historicalDailySummary (fetched for the selected date)
   */
  const currentDailySummary = computed<DailySummary | null>(() =>
    mode.value === 'live' ? energyStore.latestDailySummary : historicalDailySummary.value,
  )

  /**
   * The current time being displayed.
   *
   * Live mode:       the timestamp of the latest received snapshot
   * Historical mode: the selected timestamp
   *
   * The timeline UI uses this as the scrubber's reported position.
   */
  const currentTime = computed<Date | null>(() =>
    mode.value === 'live' ? energyStore.latestSnapshot?.timestamp ?? null : selectedTimestamp.value,
  )

  /**
   * The human-readable explanation derived from currentSnapshot.
   *
   * Re-derives automatically whenever currentSnapshot changes, so switching
   * between live and historical mode instantly updates the insight.
   */
  const currentInsight = computed<EnergyInsight | null>(() =>
    currentSnapshot.value ? describeEnergyState(currentSnapshot.value) : null,
  )

  /**
   * Financial summary derived from currentDailySummary.
   *
   * Uses the tariff rates from currentSnapshot, which means historical mode
   * uses the rates that were in effect at the viewed time. Null when the
   * summary or tariff rates are unavailable.
   */
  const currentDailyFinancials = computed<DailyFinancials | null>(() => {
    const summary = currentDailySummary.value
    const tariffs = currentSnapshot.value?.tariffs
    if (!summary || !tariffs?.importRate || !tariffs?.exportRate) return null
    return buildDailyFinancials(summary, tariffs.importRate, tariffs.exportRate, tariffs.currency)
  })

  /** True when the application is showing live data. */
  const isLive = computed(() => mode.value === 'live')

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Switch to historical mode and set the target timestamp.
   *
   * After calling this, the caller should fetch the appropriate historical
   * snapshot and pass it to setHistoricalSnapshot(). Until that call
   * completes, currentSnapshot will be null.
   */
  function enterHistoricalMode(timestamp: Date): void {
    mode.value = 'historical'
    selectedTimestamp.value = timestamp
    historicalSnapshot.value = null
    historicalDailySummary.value = null
  }

  /**
   * Return to live mode and clear all historical data.
   *
   * Instantly restores currentSnapshot to the live provider's latest value.
   */
  function exitHistoricalMode(): void {
    mode.value = 'live'
    selectedTimestamp.value = null
    historicalSnapshot.value = null
    historicalDailySummary.value = null
  }

  /**
   * Store a retrieved historical snapshot.
   *
   * Called by the timeline UI after a successful historical fetch.
   * Has no effect in live mode — switching mode first is required.
   */
  function setHistoricalSnapshot(snapshot: EnergySnapshot, dailySummary?: DailySummary): void {
    historicalSnapshot.value = snapshot
    if (dailySummary !== undefined) {
      historicalDailySummary.value = dailySummary
    }
  }

  /**
   * Update the selected timestamp while in historical mode.
   *
   * Used by the scrubber as the user drags. Changing this does not
   * automatically fetch new data — the caller is responsible for calling
   * setHistoricalSnapshot() once the fetch completes.
   */
  function setSelectedTimestamp(timestamp: Date): void {
    selectedTimestamp.value = timestamp
  }

  // ── Replay placeholders ───────────────────────────────────────────────────
  // These methods exist to make the public API complete. The timeline UI can
  // call them today; the implementation will follow in the replay milestone.

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  function startReplay(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  function pauseReplay(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  function stopReplay(): void {}

  return {
    // State
    mode,
    selectedTimestamp,
    historicalSnapshot,
    historicalDailySummary,
    isHistoricalAvailable,
    replayState,
    // Derived
    currentSnapshot,
    currentDailySummary,
    currentTime,
    currentInsight,
    currentDailyFinancials,
    isLive,
    // Actions
    enterHistoricalMode,
    exitHistoricalMode,
    setHistoricalSnapshot,
    setSelectedTimestamp,
    startReplay,
    pauseReplay,
    stopReplay,
  }
})
