import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { HassEnergyProvider } from '@cardinal/providers'
import type { HassEntityMapping } from '@cardinal/providers'
import { useEnergyStore } from './stores/energy'
import type { CardinalPanelConfig, CardinalPanelEntityMapping, HomeAssistant } from './types/hass'

function buildMapping(raw: CardinalPanelEntityMapping): HassEntityMapping {
  const mapping: HassEntityMapping = { currency: raw.currency || 'GBP' }
  const fields: (keyof CardinalPanelEntityMapping)[] = [
    'solarPower',
    'batteryPower',
    'batteryChargePower',
    'batteryDischargePower',
    'batteryStateOfCharge',
    'gridPower',
    'gridImportPower',
    'gridExportPower',
    'homeConsumption',
    'solarGeneratedToday',
    'batteryChargedToday',
    'batteryDischargedToday',
    'gridImportedToday',
    'gridExportedToday',
    'homeConsumedToday',
    'importRate',
    'exportRate',
  ]
  for (const field of fields) {
    const value = raw[field]
    if (value) (mapping as Record<string, string>)[field] = value
  }
  return mapping
}

class CardinalPanel extends HTMLElement {
  private _hass: HomeAssistant | undefined
  private _panelConfig: CardinalPanelConfig | undefined
  private _provider: HassEnergyProvider | undefined
  private _mounted = false

  set hass(hass: HomeAssistant) {
    this._hass = hass
    if (!this._mounted && this._panelConfig) {
      this._mount()
    }
  }

  set panel(panel: { config: CardinalPanelConfig }) {
    this._panelConfig = panel.config
    if (!this._mounted && this._hass) {
      this._mount()
    }
  }

  private _mount(): void {
    if (!this._hass || !this._panelConfig || this._mounted) return
    this._mounted = true

    const pinia = createPinia()
    const app = createApp(App)
    app.use(pinia)
    app.mount(this)

    const store = useEnergyStore(pinia)
    const mapping = buildMapping(this._panelConfig.entityMapping ?? {})

    this._provider = new HassEnergyProvider(this._hass.connection, mapping)
    this._provider.onSnapshot((snapshot) => store.setSnapshot(snapshot))
    this._provider.onDailySummary((summary) => store.setDailySummary(summary))
  }

  disconnectedCallback(): void {
    this._provider?.disconnect()
  }
}

customElements.define('cardinal-panel', CardinalPanel)
