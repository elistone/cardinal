from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.selector import (
    EntitySelector,
    EntitySelectorConfig,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
)

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
)

# ── Key groups (used for input normalisation and schema construction) ─────────

_LIVE_KEYS = [
    CONF_SOLAR_POWER,
    CONF_BATTERY_POWER,
    CONF_BATTERY_CHARGE_POWER,
    CONF_BATTERY_DISCHARGE_POWER,
    CONF_BATTERY_SOC,
    CONF_GRID_POWER,
    CONF_GRID_IMPORT_POWER,
    CONF_GRID_EXPORT_POWER,
    CONF_HOME_CONSUMPTION,
]

_DAILY_KEYS = [
    CONF_SOLAR_GENERATED_TODAY,
    CONF_BATTERY_CHARGED_TODAY,
    CONF_BATTERY_DISCHARGED_TODAY,
    CONF_GRID_IMPORTED_TODAY,
    CONF_GRID_EXPORTED_TODAY,
    CONF_HOME_CONSUMED_TODAY,
]

_TARIFF_KEYS = [CONF_IMPORT_RATE, CONF_EXPORT_RATE, CONF_CURRENCY]

_ALL_KEYS = _LIVE_KEYS + _DAILY_KEYS + _TARIFF_KEYS

# ── Selector helpers ──────────────────────────────────────────────────────────

_COMMON_CURRENCIES = [
    "AUD", "CAD", "CHF", "DKK", "EUR", "GBP", "NOK", "NZD", "SEK", "USD", "ZAR",
]


def _power() -> EntitySelector:
    return EntitySelector(EntitySelectorConfig(domain="sensor", device_class=SensorDeviceClass.POWER))


def _energy() -> EntitySelector:
    return EntitySelector(EntitySelectorConfig(domain="sensor", device_class=SensorDeviceClass.ENERGY))


def _battery() -> EntitySelector:
    return EntitySelector(EntitySelectorConfig(domain="sensor", device_class=SensorDeviceClass.BATTERY))


def _monetary() -> EntitySelector:
    return EntitySelector(EntitySelectorConfig(domain="sensor", device_class=SensorDeviceClass.MONETARY))


def _currency() -> SelectSelector:
    return SelectSelector(SelectSelectorConfig(
        options=_COMMON_CURRENCIES,
        mode=SelectSelectorMode.DROPDOWN,
        custom_value=True,
    ))


# ── Schemas ───────────────────────────────────────────────────────────────────

# Step 1 — live power readings (W)
LIVE_SCHEMA = vol.Schema({
    vol.Optional(CONF_SOLAR_POWER): _power(),
    vol.Optional(CONF_BATTERY_POWER): _power(),
    vol.Optional(CONF_BATTERY_CHARGE_POWER): _power(),
    vol.Optional(CONF_BATTERY_DISCHARGE_POWER): _power(),
    vol.Optional(CONF_BATTERY_SOC): _battery(),
    vol.Optional(CONF_GRID_POWER): _power(),
    vol.Optional(CONF_GRID_IMPORT_POWER): _power(),
    vol.Optional(CONF_GRID_EXPORT_POWER): _power(),
    vol.Optional(CONF_HOME_CONSUMPTION): _power(),
})

# Step 2 — daily energy totals (kWh)
DAILY_SCHEMA = vol.Schema({
    vol.Optional(CONF_SOLAR_GENERATED_TODAY): _energy(),
    vol.Optional(CONF_BATTERY_CHARGED_TODAY): _energy(),
    vol.Optional(CONF_BATTERY_DISCHARGED_TODAY): _energy(),
    vol.Optional(CONF_GRID_IMPORTED_TODAY): _energy(),
    vol.Optional(CONF_GRID_EXPORTED_TODAY): _energy(),
    vol.Optional(CONF_HOME_CONSUMED_TODAY): _energy(),
})

# Step 3 — tariffs
TARIFF_SCHEMA = vol.Schema({
    vol.Optional(CONF_IMPORT_RATE): _monetary(),
    vol.Optional(CONF_EXPORT_RATE): _monetary(),
    vol.Optional(CONF_CURRENCY): _currency(),
})

# Reconfigure — all fields on one page (user already knows their setup)
RECONFIGURE_SCHEMA = vol.Schema({
    vol.Optional(CONF_SOLAR_POWER): _power(),
    vol.Optional(CONF_BATTERY_POWER): _power(),
    vol.Optional(CONF_BATTERY_CHARGE_POWER): _power(),
    vol.Optional(CONF_BATTERY_DISCHARGE_POWER): _power(),
    vol.Optional(CONF_BATTERY_SOC): _battery(),
    vol.Optional(CONF_GRID_POWER): _power(),
    vol.Optional(CONF_GRID_IMPORT_POWER): _power(),
    vol.Optional(CONF_GRID_EXPORT_POWER): _power(),
    vol.Optional(CONF_HOME_CONSUMPTION): _power(),
    vol.Optional(CONF_SOLAR_GENERATED_TODAY): _energy(),
    vol.Optional(CONF_BATTERY_CHARGED_TODAY): _energy(),
    vol.Optional(CONF_BATTERY_DISCHARGED_TODAY): _energy(),
    vol.Optional(CONF_GRID_IMPORTED_TODAY): _energy(),
    vol.Optional(CONF_GRID_EXPORTED_TODAY): _energy(),
    vol.Optional(CONF_HOME_CONSUMED_TODAY): _energy(),
    vol.Optional(CONF_IMPORT_RATE): _monetary(),
    vol.Optional(CONF_EXPORT_RATE): _monetary(),
    vol.Optional(CONF_CURRENCY): _currency(),
})

# ── Auto-discovery heuristics ─────────────────────────────────────────────────


def _sensors(registry: er.EntityRegistry) -> list[er.RegistryEntry]:
    return [e for e in registry.entities.values() if e.domain == "sensor"]


def _suggest(
    sensors: list[er.RegistryEntry],
    device_classes: list[str],
    keywords: list[str],
) -> str | None:
    """Return the entity ID of the first matching sensor, or None."""
    for entity in sensors:
        dc = entity.device_class or entity.original_device_class
        if dc in device_classes:
            name = (entity.name or entity.original_name or entity.entity_id).lower()
            if any(kw in name for kw in keywords):
                return entity.entity_id
    return None


def _live_suggestions(sensors: list[er.RegistryEntry]) -> dict[str, str]:
    pwr = [SensorDeviceClass.POWER]
    bat = [SensorDeviceClass.BATTERY]
    s = _suggest
    return _truthy({
        CONF_SOLAR_POWER: s(sensors, pwr, ["solar", "pv", "generation"]),
        CONF_BATTERY_POWER: s(sensors, pwr, ["battery_power", "bat_power"]),
        CONF_BATTERY_CHARGE_POWER: s(sensors, pwr, ["battery_charge", "charge_power", "bat_charge"]),
        CONF_BATTERY_DISCHARGE_POWER: s(sensors, pwr, ["battery_discharge", "discharge_power", "bat_discharge"]),
        CONF_BATTERY_SOC: s(sensors, bat, ["battery", "soc", "state_of_charge"]),
        CONF_GRID_POWER: s(sensors, pwr, ["grid_power", "net_power", "meter_power"]),
        CONF_GRID_IMPORT_POWER: s(sensors, pwr, ["grid_import", "power_from_grid", "import_power", "grid_in"]),
        CONF_GRID_EXPORT_POWER: s(sensors, pwr, ["grid_export", "power_to_grid", "export_power", "grid_out"]),
        CONF_HOME_CONSUMPTION: s(sensors, pwr, ["load_power", "home", "house", "load", "consumption"]),
    })


def _daily_suggestions(sensors: list[er.RegistryEntry]) -> dict[str, str]:
    nrg = [SensorDeviceClass.ENERGY]
    s = _suggest
    return _truthy({
        CONF_SOLAR_GENERATED_TODAY: s(sensors, nrg, ["pv_energy_today", "solar_energy_today", "pv_today", "generation_today"]),
        CONF_BATTERY_CHARGED_TODAY: s(sensors, nrg, ["charge_energy_today", "battery_charge_today", "charged_today"]),
        CONF_BATTERY_DISCHARGED_TODAY: s(sensors, nrg, ["discharge_energy_today", "battery_discharge_today", "discharged_today"]),
        CONF_GRID_IMPORTED_TODAY: s(sensors, nrg, ["energy_from_grid_today", "grid_import_today", "import_energy_today"]),
        CONF_GRID_EXPORTED_TODAY: s(sensors, nrg, ["energy_to_grid_today", "grid_export_today", "export_energy_today"]),
        CONF_HOME_CONSUMED_TODAY: s(sensors, nrg, ["load_consumption_today", "home_consumption_today", "consumed_today"]),
    })


def _tariff_suggestions(sensors: list[er.RegistryEntry]) -> dict[str, str]:
    mon = [SensorDeviceClass.MONETARY]
    s = _suggest
    return _truthy({
        CONF_IMPORT_RATE: s(sensors, mon, ["import", "current_rate", "tariff", "standing"]),
        CONF_EXPORT_RATE: s(sensors, mon, ["export", "feed", "export_rate"]),
    })


def _truthy(d: dict[str, str | None]) -> dict[str, str]:
    """Drop None and empty-string values — entity selectors reject them."""
    return {k: v for k, v in d.items() if v}


def _normalise(user_input: dict[str, Any], keys: list[str]) -> dict[str, Any]:
    """Return a dict with exactly the given keys; absent or None values become ''."""
    return {key: user_input.get(key) or "" for key in keys}


# ── Config flow ───────────────────────────────────────────────────────────────


class CardinalConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    def __init__(self) -> None:
        # Accumulated form data across all steps.
        self._data: dict[str, Any] = {key: "" for key in _ALL_KEYS}
        self._data[CONF_CURRENCY] = "GBP"

    # ── Initial setup: three focused steps ───────────────────────────────────

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            live = _normalise(user_input, _LIVE_KEYS)
            if not any(live.values()):
                # Require at least one live sensor — otherwise Cardinal shows nothing.
                return self.async_show_form(
                    step_id="user",
                    data_schema=self.add_suggested_values_to_schema(LIVE_SCHEMA, user_input),
                    errors={"base": "no_live_sensors"},
                )
            self._data.update(live)
            return await self.async_step_daily()

        sensors = _sensors(er.async_get(self.hass))
        return self.async_show_form(
            step_id="user",
            data_schema=self.add_suggested_values_to_schema(LIVE_SCHEMA, _live_suggestions(sensors)),
        )

    async def async_step_daily(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            self._data.update(_normalise(user_input, _DAILY_KEYS))
            return await self.async_step_tariffs()

        sensors = _sensors(er.async_get(self.hass))
        return self.async_show_form(
            step_id="daily",
            data_schema=self.add_suggested_values_to_schema(DAILY_SCHEMA, _daily_suggestions(sensors)),
        )

    async def async_step_tariffs(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            self._data.update(_normalise(user_input, _TARIFF_KEYS))
            return self.async_create_entry(title="Cardinal", data=self._data)

        sensors = _sensors(er.async_get(self.hass))
        suggestions = {
            **_tariff_suggestions(sensors),
            CONF_CURRENCY: self._data[CONF_CURRENCY],
        }
        return self.async_show_form(
            step_id="tariffs",
            data_schema=self.add_suggested_values_to_schema(TARIFF_SCHEMA, suggestions),
        )

    # ── Reconfigure: one page with all fields pre-filled ─────────────────────

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        entry = self._get_reconfigure_entry()

        if user_input is not None:
            updated = {
                **_normalise(user_input, _LIVE_KEYS + _DAILY_KEYS + [CONF_IMPORT_RATE, CONF_EXPORT_RATE]),
                CONF_CURRENCY: user_input.get(CONF_CURRENCY) or entry.data.get(CONF_CURRENCY, "GBP"),
            }
            return self.async_update_reload_and_abort(entry, data_updates=updated)

        # Pre-fill from current entry; drop empty strings so pickers show no selection.
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=self.add_suggested_values_to_schema(
                RECONFIGURE_SCHEMA,
                _truthy(entry.data),
            ),
        )
