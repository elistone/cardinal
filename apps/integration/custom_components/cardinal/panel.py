from __future__ import annotations

import logging
from pathlib import Path

# async_register_panel was removed from homeassistant.components.frontend in
# recent HA releases.  It now lives in panel_custom, which assembles the
# _panel_custom config block and delegates to frontend.async_register_built_in_panel.
from homeassistant.components.frontend import async_panel_exists, async_remove_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.panel_custom import async_register_panel
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    CONF_BATTERY_CHARGE_POWER,
    CONF_BATTERY_CHARGED_TODAY,
    CONF_BATTERY_DISCHARGE_POWER,
    CONF_BATTERY_DISCHARGED_TODAY,
    CONF_BATTERY_POWER,
    CONF_BATTERY_SOC,
    CONF_CURRENCY,
    CONF_EXPORT_RATE,
    CONF_GRID_EXPORT_POWER,
    CONF_GRID_EXPORTED_TODAY,
    CONF_GRID_IMPORT_POWER,
    CONF_GRID_IMPORTED_TODAY,
    CONF_GRID_POWER,
    CONF_HOME_CONSUMED_TODAY,
    CONF_HOME_CONSUMPTION,
    CONF_IMPORT_RATE,
    CONF_SOLAR_GENERATED_TODAY,
    CONF_SOLAR_POWER,
    DOMAIN,
    FRONTEND_DIR,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL,
)

_LOGGER = logging.getLogger(__name__)

FRONTEND_PATH = Path(__file__).parent / FRONTEND_DIR
STATIC_URL = f"/{DOMAIN}"


async def async_setup_panel(hass: HomeAssistant, entry: ConfigEntry) -> None:
    # Register the static files that serve the frontend bundle.
    # async_register_static_paths raises ValueError if the path is already
    # registered (no removal API exists), so we guard against reloads here.
    try:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(FRONTEND_PATH), cache_headers=False)]
        )
    except ValueError:
        _LOGGER.debug("Static path %s already registered, skipping", STATIC_URL)

    # panel_custom.async_register_panel calls async_register_built_in_panel
    # with update=False, so registering an already-existing panel raises
    # ValueError.  Remove any stale registration first (e.g. from a previous
    # setup that crashed during teardown before async_unload_entry could run).
    if async_panel_exists(hass, PANEL_URL):
        async_remove_panel(hass, PANEL_URL, warn_if_unknown=False)

    await async_register_panel(
        hass,
        frontend_url_path=PANEL_URL,
        webcomponent_name="cardinal-panel",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        js_url=f"{STATIC_URL}/cardinal-panel.js",
        embed_iframe=False,
        trust_external=False,
        config={
            "entityMapping": {
                "solarPower": entry.data.get(CONF_SOLAR_POWER, ""),
                "batteryPower": entry.data.get(CONF_BATTERY_POWER, ""),
                "batteryChargePower": entry.data.get(CONF_BATTERY_CHARGE_POWER, ""),
                "batteryDischargePower": entry.data.get(CONF_BATTERY_DISCHARGE_POWER, ""),
                "batteryStateOfCharge": entry.data.get(CONF_BATTERY_SOC, ""),
                "gridPower": entry.data.get(CONF_GRID_POWER, ""),
                "gridImportPower": entry.data.get(CONF_GRID_IMPORT_POWER, ""),
                "gridExportPower": entry.data.get(CONF_GRID_EXPORT_POWER, ""),
                "homeConsumption": entry.data.get(CONF_HOME_CONSUMPTION, ""),
                "solarGeneratedToday": entry.data.get(CONF_SOLAR_GENERATED_TODAY, ""),
                "batteryChargedToday": entry.data.get(CONF_BATTERY_CHARGED_TODAY, ""),
                "batteryDischargedToday": entry.data.get(CONF_BATTERY_DISCHARGED_TODAY, ""),
                "gridImportedToday": entry.data.get(CONF_GRID_IMPORTED_TODAY, ""),
                "gridExportedToday": entry.data.get(CONF_GRID_EXPORTED_TODAY, ""),
                "homeConsumedToday": entry.data.get(CONF_HOME_CONSUMED_TODAY, ""),
                "importRate": entry.data.get(CONF_IMPORT_RATE, ""),
                "exportRate": entry.data.get(CONF_EXPORT_RATE, ""),
                "currency": entry.data.get(CONF_CURRENCY, "GBP"),
            },
        },
        require_admin=False,
    )
    _LOGGER.debug("Cardinal panel registered at /%s", PANEL_URL)
