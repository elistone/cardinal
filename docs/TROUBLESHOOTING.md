# Troubleshooting Cardinal

---

## Cardinal does not appear in the sidebar

**Symptoms:** No "Cardinal" entry in the HA sidebar after installation.

**Causes and fixes:**

1. **The integration was not loaded** — check Settings → Integrations. If Cardinal is not listed there, the custom component was not found. Verify `custom_components/cardinal/` exists in your HA config directory and contains `manifest.json`. Then restart Home Assistant.

2. **The config entry was never created** — the integration must be added via Settings → Integrations → Add Integration → Cardinal before the panel appears. The panel is registered only after you complete the config flow.

3. **The panel JavaScript failed to load** — open your browser's developer console (F12 → Console) and look for 404 errors or JavaScript exceptions. The JS file should load from `/cardinal_static/cardinal-panel.js`.

4. **Build output is missing** — verify that `custom_components/cardinal/frontend/cardinal-panel.js` exists and is non-empty. If it is missing, run `pnpm build --filter @cardinal/frontend` and copy the result.

---

## 403 Forbidden when refreshing the Cardinal page

**Symptoms:** Navigating to Cardinal from the sidebar works, but pressing the browser's refresh button at `/cardinal` returns a 403 Forbidden error.

**Cause:** The panel URL (`/cardinal`) and the static file path must not be the same string. When they match, HA's HTTP router resolves `/cardinal` to the static file directory rather than the HA SPA, and serving a bare directory without an index file produces 403.

Cardinal registers static assets at `/cardinal_static` (not `/cardinal`) precisely to avoid this collision. If you are seeing a 403, you are likely running an older version of Cardinal where the static path was incorrectly set to `/cardinal`.

**Fix:** Update Cardinal to the latest version. If you are running a manual install, ensure `panel.py` sets `STATIC_URL = f"/{DOMAIN}_static"`, then restart Home Assistant.

---

## Companion App shows only a dark background

**Symptoms:** On the Home Assistant Companion App (iOS or Android), the Cardinal panel renders a blank dark screen instead of the live energy view.

**What we know:** Cardinal injects all CSS (including its dark theme tokens) into `document.head` when `cardinal-panel.js` is evaluated. The `connectedCallback()` lifecycle method then clones that style into `ha-panel-custom`'s shadow root. The dark background you see confirms that the style clone ran successfully — `--color-bg` is resolving and `.cardinal-app { background: var(--color-bg) }` is being applied.

**Most likely cause:** The Vue app mounted but encountered a JavaScript error during component rendering. Because Vue catches render errors internally, the panel can fail silently, leaving only the background element in the DOM.

**How to diagnose:**
1. On iOS: enable Web Inspector in Safari Settings → Advanced, connect the device, and open Safari on your Mac → Develop → [your device] → Cardinal.
2. On Android: enable USB debugging and use Chrome DevTools via `chrome://inspect`.
3. Look for JavaScript errors or warnings in the Console tab.
4. Check whether `document.querySelector('cardinal-panel')._vm` exists (it will if Vue mounted).

**Workaround while diagnosing:** Reload the panel from the sidebar (tap another sidebar item, then tap Cardinal again) rather than using the browser's native refresh button.

---

## "Set up Cardinal" screen on every load

**Symptoms:** Cardinal shows the "Set up Cardinal" screen even though you completed the config flow.

**Cause:** All entity fields were left blank, or every configured entity is missing from Home Assistant. Cardinal reports itself as unconfigured when no live sensors are mapped.

**Fix:** Go to Settings → Integrations → Cardinal and reconfigure. Fill in at least one live power sensor (solar, battery, or grid). Check that the entity IDs you enter actually exist in Developer Tools → States.

---

## Sensors marked "Unavailable" in the health overlay

**Symptoms:** The sensor health button shows a warning badge. Inside the overlay, some sensors show "Unavailable" instead of a value.

**Causes:**

- The sensor exists in HA but is currently reporting `unavailable` or `unknown`. This is usually a hardware or integration issue — the sensor itself is not communicating.
- The inverter / integration is offline or restarting.

**Fix:** Check the sensor in Developer Tools → States. If it shows `unavailable`, the problem is upstream of Cardinal. Restart your inverter integration or check your hardware.

---

## Sensors marked "Missing" in the health overlay

**Symptoms:** The health overlay shows sensors as "Missing".

**Cause:** An entity ID was not provided during setup, or the ID you entered does not exist in Home Assistant.

**Fix:**

1. Go to Developer Tools → States and search for the sensor you intended to map.
2. Copy the exact entity ID (e.g. `sensor.pv_power`).
3. Go to Settings → Integrations → Cardinal → Reconfigure and paste the correct ID.

---

## Data is stuck / not updating

**Symptoms:** The panel loads but numbers do not change when power flows change.

**Causes:**

1. **The underlying HA sensor is not updating** — check the sensor in Developer Tools → States. If the "Last changed" time is old, the problem is the sensor source, not Cardinal.

2. **WebSocket subscription missed** — in rare cases the subscription may not have started correctly. Reload the browser tab to force a fresh connection.

**Fix:** Reload the browser tab. If the problem persists, restart Home Assistant.

---

## "Reconnecting" banner appears

**Symptoms:** Cardinal shows a "Reconnecting…" banner with dimmed stale data.

**Cause:** The WebSocket connection between the browser and Home Assistant was lost. This is normal during HA restarts or network interruptions. Cardinal will reconnect automatically.

**Fix:** Wait. Cardinal reconnects automatically when HA becomes available again. If it does not reconnect after a few minutes, reload the page.

---

## Values look wrong

**Symptoms:** Solar shows 0W when panels are generating, or battery direction is inverted.

**Cause:** The entity mapping is pointing at the wrong sensor, or the sensor uses a different sign convention than expected.

**Common mistakes:**

| Symptom | Likely cause |
| --- | --- |
| Solar always 0W | `solar_power` mapped to the wrong entity, or sensor is in kW not W |
| Battery always idle | Battery power is a signed sensor — configure `battery_power` instead of both charge and discharge |
| Grid import/export reversed | Separate sensors have import and export swapped |
| Very large values (e.g. 3600000W) | Sensor is reporting in kW — Cardinal expects W. Check sensor unit in Developer Tools → States |

**Units:** Cardinal expects power sensors to report in **watts (W)** and energy sensors in **kilowatt-hours (kWh)**. If your sensors report in different units, Cardinal will show incorrect values. Some inverter integrations report in kW — check the `unit_of_measurement` attribute in Developer Tools → States.

---

## Inspecting live data in the browser

Cardinal logs sensor mappings and incoming snapshots to the browser console in development mode. In a production install, you can still inspect the data directly:

1. Open your browser's developer console (F12 → Console)
2. Open the Network tab and filter for `websocket` — this shows the raw WebSocket messages
3. In the Console, run:

```js
// Inspect the Cardinal panel element
const panel = document.querySelector('cardinal-panel')

// Or look at the Pinia store (if vue devtools are installed)
```

Alternatively, use Home Assistant's Developer Tools → States to verify sensor values directly.

---

## Checking Home Assistant logs

If the panel fails to register or the integration throws on startup:

1. Go to Settings → System → Logs
2. Filter for `cardinal`
3. Look for `ERROR` or `WARNING` lines

Common log errors:

| Log message | Meaning |
| --- | --- |
| `No module named 'cardinal'` | The `custom_components/cardinal` directory is not in the HA config path |
| `Integration 'cardinal' not found` | Same as above — HA did not find the component |
| `Error setting up entry Cardinal` | An exception in `__init__.py` or `panel.py` — check the full traceback |
| `Static path already registered` | The integration was loaded twice — remove duplicate config entries |

---

## Getting more help

Enable debug logging for the Cardinal integration by adding this to your `configuration.yaml`:

```yaml
logger:
  default: warning
  logs:
    custom_components.cardinal: debug
```

Then restart Home Assistant and check the logs again for detailed output from the integration setup.
