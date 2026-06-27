/**
 * Browser dev entry point.
 *
 * Mounts the Cardinal application directly into a DOM element using a
 * MockEnergyProvider backed by fixture data.  This gives a fully functional
 * browser runtime that matches the Home Assistant panel without requiring an
 * active Home Assistant connection.
 *
 * Entry point for `pnpm dev` (Vite dev server).
 * For the HA production build, see main.ts.
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { MockEnergyProvider } from './dev/MockEnergyProvider'
import { useEnergyStore } from './stores/energy'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.mount('#app')

const store = useEnergyStore(pinia)
const provider = new MockEnergyProvider()

// Register callbacks — each fires synchronously on registration, so Vue
// batches all store updates into a single re-render with complete data.
provider.onConnectionStatus((status) => store.setConnectionStatus(status))
provider.onHealth((h) => store.setHealth(h))
provider.onSnapshot((s) => store.setSnapshot(s))
provider.onDailySummary((d) => store.setDailySummary(d))
