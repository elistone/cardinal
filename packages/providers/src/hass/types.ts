import type { Connection } from 'home-assistant-js-websocket'

export type HassConnection = Connection

export interface HassState {
  entity_id: string
  state: string
  attributes: Record<string, unknown>
  last_changed: string
  last_updated: string
}

export interface HassEntityMapping {
  solarPower?: string
  batteryPower?: string
  batteryChargePower?: string
  batteryDischargePower?: string
  batteryStateOfCharge?: string
  gridPower?: string
  gridImportPower?: string
  gridExportPower?: string
  homeConsumption?: string
  solarGeneratedToday?: string
  batteryChargedToday?: string
  batteryDischargedToday?: string
  gridImportedToday?: string
  gridExportedToday?: string
  homeConsumedToday?: string
  importRate?: string
  exportRate?: string
  currency?: string
}
