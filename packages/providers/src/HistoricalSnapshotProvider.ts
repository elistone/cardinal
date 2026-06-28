import type { DailySummary, EnergySnapshot } from '@cardinal/domain'

/**
 * A request for the snapshot closest to a specific point in time.
 */
export interface HistoricalSnapshotQuery {
  /** The moment in time to retrieve data for. */
  readonly timestamp: Date
}

/**
 * The result of a historical snapshot query.
 *
 * `isApproximate` is true when the provider could not find an exact match
 * and returned the nearest available sample instead. The UI should surface
 * this so the user understands the displayed time may differ from the
 * requested time.
 */
export interface HistoricalSnapshotResult {
  /** The snapshot at or nearest to the requested timestamp. */
  readonly snapshot: EnergySnapshot
  /**
   * The optional daily summary associated with the snapshot's calendar date.
   *
   * Present when the provider can retrieve accumulated daily totals for the
   * same day. Null when daily history is unavailable for that date.
   */
  readonly dailySummary: DailySummary | null
  /**
   * The actual timestamp of the returned snapshot.
   *
   * May differ from the requested timestamp when `isApproximate` is true.
   */
  readonly timestamp: Date
  /**
   * True when no snapshot existed at the exact requested timestamp and the
   * provider returned the nearest available sample instead.
   */
  readonly isApproximate: boolean
}

/**
 * Describes the range of historical data available from this provider.
 */
export interface HistoricalAvailability {
  /** True when this provider has any historical data at all. */
  readonly isAvailable: boolean
  /**
   * The earliest timestamp available for retrieval.
   * Null when `isAvailable` is false.
   */
  readonly oldestAvailable: Date | null
  /**
   * The most recent timestamp available for retrieval.
   * This is typically a few minutes behind the live state.
   * Null when `isAvailable` is false.
   */
  readonly newestAvailable: Date | null
}

/**
 * A provider that retrieves historical EnergySnapshot data.
 *
 * This interface is intentionally free of Home Assistant concepts.
 * Implementations may back it with any data source:
 *
 * - Home Assistant Recorder API
 * - Home Assistant History API
 * - Cardinal's own cached snapshots (future)
 * - Cloud-stored snapshots (future)
 * - Static fixture data for testing
 *
 * The provider contract is simple: given a timestamp, return the best
 * available snapshot for that moment. The caller decides what to do with
 * `isApproximate`.
 */
export interface IHistoricalSnapshotProvider {
  /**
   * Returns information about what historical data is available.
   *
   * Call this before presenting the timeline to the user. If `isAvailable`
   * is false, the timeline UI should not be shown.
   */
  getAvailability(): Promise<HistoricalAvailability>

  /**
   * Fetches the snapshot closest to the requested timestamp.
   *
   * Returns null when no data is available for the requested period
   * (e.g. before the sensor was installed, or in a gap in recording).
   */
  fetchSnapshot(query: HistoricalSnapshotQuery): Promise<HistoricalSnapshotResult | null>
}
