from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .panel import async_setup_panel

type CardinalConfigEntry = ConfigEntry


async def async_setup_entry(hass: HomeAssistant, entry: CardinalConfigEntry) -> bool:
    await async_setup_panel(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: CardinalConfigEntry) -> bool:
    return True
