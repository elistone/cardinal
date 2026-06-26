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
