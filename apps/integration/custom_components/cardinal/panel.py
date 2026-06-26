from pathlib import Path

from homeassistant.components.frontend import async_register_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN, FRONTEND_DIR, PANEL_ICON, PANEL_TITLE, PANEL_URL

FRONTEND_PATH = Path(__file__).parent / FRONTEND_DIR
STATIC_URL = f"/{DOMAIN}"


async def async_setup_panel(hass: HomeAssistant) -> None:
    await hass.http.async_register_static_paths(
        [StaticPathConfig(STATIC_URL, str(FRONTEND_PATH), cache_headers=False)]
    )

    async_register_panel(
        hass,
        component_name="custom",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        frontend_url_path=PANEL_URL,
        config={
            "_panel_custom": {
                "name": "cardinal-panel",
                "js_url": f"{STATIC_URL}/cardinal-panel.js",
                "embed_iframe": False,
                "trust_external": False,
            }
        },
        require_admin=False,
    )
