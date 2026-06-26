import {subscribeEntities} from 'home-assistant-js-websocket'
import type {ConnectionStatusCallback, DailySummaryCallback, EnergyProvider, HealthCallback, SnapshotCallback} from '../EnergyProvider.js'
import type {HassConnection, HassEntityMapping, HassState} from './types.js'
import {translateDailySummary, translateEnergySnapshot} from './translate.js'
import {assessConfigurationHealth} from './health.js'

export class HassEnergyProvider implements EnergyProvider {
  private readonly connection: HassConnection
  private readonly mapping: HassEntityMapping
  private snapshotCallbacks: Set<SnapshotCallback> = new Set()
  private summaryCallbacks: Set<DailySummaryCallback> = new Set()
  private healthCallbacks: Set<HealthCallback> = new Set()
  private connectionStatusCallbacks: Set<ConnectionStatusCallback> = new Set()
  private unsubscribe: (() => void) | undefined
  private readonly onReady: () => void
  private readonly onDisconnected: () => void

  constructor(connection: HassConnection, mapping: HassEntityMapping) {
    this.connection = connection
    this.mapping = mapping
    this.onReady = () => {
      this.connectionStatusCallbacks.forEach((cb) => cb('connected'))
    }
    this.onDisconnected = () => {
      this.connectionStatusCallbacks.forEach((cb) => cb('disconnected'))
    }
    this.connection.addEventListener('ready', this.onReady)
    this.connection.addEventListener('disconnected', this.onDisconnected)
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
      this.mapping.solarGeneratedToday,
      this.mapping.batteryChargedToday,
      this.mapping.batteryDischargedToday,
      this.mapping.gridImportedToday,
      this.mapping.gridExportedToday,
      this.mapping.homeConsumedToday,
    ].filter(Boolean) as string[])

    const hasDailySensors = [
      this.mapping.solarGeneratedToday,
      this.mapping.batteryChargedToday,
      this.mapping.batteryDischargedToday,
      this.mapping.gridImportedToday,
      this.mapping.gridExportedToday,
      this.mapping.homeConsumedToday,
    ].some(Boolean)

    this.unsubscribe = subscribeEntities(this.connection, (entities) => {
      const relevant = Object.fromEntries(
        Object.entries(entities).filter(([id]) => trackedIds.has(id)),
      ) as Record<string, HassState>

      const snapshot = translateEnergySnapshot(relevant, this.mapping)
      this.snapshotCallbacks.forEach((cb) => cb(snapshot))

      if (hasDailySensors) {
        const summary = translateDailySummary(relevant, this.mapping)
        this.summaryCallbacks.forEach((cb) => cb(summary))
      }

      const health = assessConfigurationHealth(relevant, this.mapping)
      this.healthCallbacks.forEach((cb) => cb(health))
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

  onHealth(callback: HealthCallback): () => void {
    this.healthCallbacks.add(callback)
    return () => { this.healthCallbacks.delete(callback) }
  }

  onConnectionStatus(callback: ConnectionStatusCallback): () => void {
    this.connectionStatusCallbacks.add(callback)
    return () => { this.connectionStatusCallbacks.delete(callback) }
  }

  disconnect(): void {
    this.connection.removeEventListener('ready', this.onReady)
    this.connection.removeEventListener('disconnected', this.onDisconnected)
    this.unsubscribe?.()
    this.snapshotCallbacks.clear()
    this.summaryCallbacks.clear()
    this.healthCallbacks.clear()
    this.connectionStatusCallbacks.clear()
  }
}
