/**
 * The two modes Cardinal can operate in.
 *
 * - `live`        The application is connected to Home Assistant and displaying
 *                 the current state of the home. Data updates continuously.
 *
 * - `historical`  The application is displaying a snapshot from a past moment.
 *                 Data is frozen. The interface behaves as if time has stopped.
 *
 * Components never receive `TimeMode` directly. They consume `currentSnapshot`
 * and render identically regardless of which mode produced it. The mode only
 * controls which snapshot is surfaced as current.
 */
export type TimeMode = 'live' | 'historical'
