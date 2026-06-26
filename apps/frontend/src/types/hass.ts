import type { Connection } from 'home-assistant-js-websocket'

export interface HomeAssistant {
  connection: Connection
  states: Record<string, unknown>
  user: {
    id: string
    name: string
    is_admin: boolean
  }
  language: string
  locale: {
    language: string
    number_format: string
    time_format: string
  }
}

export interface CardinalPanelEntityMapping {
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

export interface CardinalPanelConfig {
  entityMapping?: CardinalPanelEntityMapping
}

export interface CardinalPanel {
  config: CardinalPanelConfig
}
