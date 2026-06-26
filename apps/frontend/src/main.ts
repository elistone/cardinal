import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { HassEnergyProvider } from '@cardinal/providers'
import { useEnergyStore } from './stores/energy'
import type { HomeAssistant } from './types/hass'

class CardinalPanel extends HTMLElement {
  private _hass: HomeAssistant | undefined
  private _provider: HassEnergyProvider | undefined
  private _mounted = false

  set hass(hass: HomeAssistant) {
    this._hass = hass
    if (!this._mounted) {
      this._mount()
    }
  }

  private _mount(): void {
    if (!this._hass || this._mounted) return
    this._mounted = true

    const pinia = createPinia()
    const app = createApp(App)
    app.use(pinia)
    app.mount(this)

    const store = useEnergyStore(pinia)

    // Entity mapping will come from the integration config entry in a future step.
    // For now, the provider is constructed with an empty mapping as a placeholder.
    this._provider = new HassEnergyProvider(this._hass.connection, {
      currency: 'GBP',
    })

    this._provider.onSnapshot((snapshot) => store.setSnapshot(snapshot))
    this._provider.onDailySummary((summary) => store.setDailySummary(summary))
  }

  disconnectedCallback(): void {
    this._provider?.disconnect()
  }
}

customElements.define('cardinal-panel', CardinalPanel)
