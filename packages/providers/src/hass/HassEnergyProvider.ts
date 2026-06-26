import {subscribeEntities} from 'home-assistant-js-websocket'
import type {DailySummaryCallback, EnergyProvider, SnapshotCallback} from '../EnergyProvider.js'
import type {HassConnection, HassEntityMapping, HassState} from './types.js'
import {translateEnergySnapshot} from './translate.js'

export class HassEnergyProvider implements EnergyProvider {
  private readonly connection: HassConnection
  private readonly mapping: HassEntityMapping
  private snapshotCallbacks: Set<SnapshotCallback> = new Set()
  private summaryCallbacks: Set<DailySummaryCallback> = new Set()
  private unsubscribe: (() => void) | undefined

  constructor(connection: HassConnection, mapping: HassEntityMapping) {
    this.connection = connection
    this.mapping = mapping
    this.subscribe()
  }

  private subscribe(): void {
    const trackedIds = new Set([
      this.mapping.solarPower,
      this.mapping.batteryPower,
      this.mapping.batteryChargePower,
      this.mapping.batteryDischargePower,
      this.mapping.batteryStateOfCharge,
      this.mapping.gridPower,
      this.mapping.gridImportPower,
      this.mapping.gridExportPower,
      this.mapping.homeConsumption,
    ].filter(Boolean) as string[])

    this.unsubscribe = subscribeEntities(this.connection, (entities) => {
      const relevant = Object.fromEntries(
        Object.entries(entities).filter(([id]) => trackedIds.has(id)),
      ) as Record<string, HassState>

      const snapshot = translateEnergySnapshot(relevant, {
        solarPower: this.mapping.solarPower,
        batteryPower: this.mapping.batteryPower,
        batteryChargePower: this.mapping.batteryChargePower,
        batteryDischargePower: this.mapping.batteryDischargePower,
        batteryStateOfCharge: this.mapping.batteryStateOfCharge,
        gridPower: this.mapping.gridPower,
        gridImportPower: this.mapping.gridImportPower,
        gridExportPower: this.mapping.gridExportPower,
        homeConsumption: this.mapping.homeConsumption,
      })

      this.snapshotCallbacks.forEach((cb) => cb(snapshot))
    })
  }

  onSnapshot(callback: SnapshotCallback): () => void {
    this.snapshotCallbacks.add(callback)
    return () => { this.snapshotCallbacks.delete(callback) }
  }

  onDailySummary(callback: DailySummaryCallback): () => void {
    this.summaryCallbacks.add(callback)
    return () => { this.summaryCallbacks.delete(callback) }
  }

  disconnect(): void {
    this.unsubscribe?.()
    this.snapshotCallbacks.clear()
    this.summaryCallbacks.clear()
  }
}
