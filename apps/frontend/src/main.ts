/**
 * Home Assistant custom panel entry point.
 *
 * Defines the <cardinal-panel> custom element, which HA renders inside
 * <ha-panel-custom> — a Lit element that creates its own Shadow DOM.
 *
 * Shadow DOM and CSS injection
 * ─────────────────────────────
 * Vite's cssInjectedByJsPlugin injects all component CSS into document.head.
 * CSS in document.head does NOT cross shadow DOM boundaries, so styles injected
 * there are invisible to elements inside <ha-panel-custom>'s shadow root —
 * including every element inside <cardinal-panel>.
 *
 * connectedCallback() resolves this by cloning the injected <style> element
 * (identified by id="cardinal-styles") into the shadow root that contains
 * <cardinal-panel>.  CSS placed inside a shadow root applies to all elements
 * within it, so the cloned style reaches all component subtrees correctly.
 *
 * This does not affect the browser dev runtime (main.dev.ts), which mounts
 * into a regular <div> in the main document where document.head styles apply.
 */

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
    if (value) (mapping as unknown as Record<string, string>)[field] = value
  }
  return mapping
}

class CardinalPanel extends HTMLElement {
  private _hass: HomeAssistant | undefined
  private _panelConfig: CardinalPanelConfig | undefined
  private _provider: HassEnergyProvider | undefined
  private _mounted = false

  connectedCallback(): void {
    // cardinal-panel is rendered inside ha-panel-custom's Shadow DOM.
    // Clone our injected styles into that shadow root so they apply to
    // our component tree.  document.head styles are invisible across
    // shadow boundaries.
    const root = this.getRootNode()
    if (root instanceof ShadowRoot && !root.getElementById('cardinal-styles')) {
      const style = document.getElementById('cardinal-styles')
      if (style) {
        root.insertBefore(style.cloneNode(true), root.firstChild)
      }
    }
  }

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

    // HA only calls _mount() after hass.connection is established, so start connected.
    // The onConnectionStatus callback handles subsequent disconnects and reconnects.
    store.setConnectionStatus('connected')

    const mapping = buildMapping(this._panelConfig.entityMapping ?? {})

    if (import.meta.env.DEV) {
      console.debug('[Cardinal] Mounting panel with entity mapping:', mapping)
    }

    this._provider = new HassEnergyProvider(this._hass.connection, mapping)

    this._provider.onConnectionStatus((status) => {
      if (import.meta.env.DEV) console.debug('[Cardinal] Connection status changed:', status)
      store.setConnectionStatus(status)
    })

    this._provider.onSnapshot((s) => {
      if (import.meta.env.DEV) {
        console.debug('[Cardinal] Snapshot received:', {
          solar: `${s.solar.generatingWatts}W`,
          battery: `${s.battery.chargePercent}% ${s.battery.isCharging ? `↑${s.battery.chargingWatts}W` : s.battery.isDischarging ? `↓${s.battery.dischargingWatts}W` : 'idle'}`,
          grid: s.grid.isImporting ? `importing ${s.grid.importingWatts}W` : s.grid.isExporting ? `exporting ${s.grid.exportingWatts}W` : 'idle',
          home: `${s.home.consumingWatts}W`,
        })
      }
      store.setLatestSnapshot(s)
    })

    this._provider.onDailySummary((summary) => store.setLatestDailySummary(summary))

    this._provider.onHealth((h) => {
      if (import.meta.env.DEV) {
        const problems = Object.entries({ ...h.live, ...h.daily })
          .filter(([, c]) => c.status !== 'configured')
          .map(([k, c]) => `${k}: ${c.status}${c.status !== 'missing' ? ` (${c.entityId})` : ''}`)
        if (problems.length > 0) {
          console.debug('[Cardinal] Sensor health issues:', problems)
        }
      }
      store.setHealth(h)
    })
  }

  disconnectedCallback(): void {
    this._provider?.disconnect()
  }
}

customElements.define('cardinal-panel', CardinalPanel)
