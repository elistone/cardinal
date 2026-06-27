from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import PANEL_URL

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    # Imported here, not at module level, so that importing __init__.py (which
    # happens when HA loads the config flow) never touches panel.py or the HA
    # frontend/http APIs.  Any import failure in panel.py would otherwise prevent
    # the config flow handler from registering and cause "Invalid handler specified".
    from .panel import async_setup_panel

    await async_setup_panel(hass, entry)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    from homeassistant.components.frontend import async_remove_panel

    try:
        async_remove_panel(hass, PANEL_URL)
    except Exception:
        _LOGGER.debug("Panel %s was not registered, skipping removal", PANEL_URL)

    return True
