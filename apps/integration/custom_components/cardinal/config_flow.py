from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.helpers import entity_registry as er

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


def _suggest_entity(
    entities: list[er.RegistryEntry],
    device_classes: list[str],
    keywords: list[str],
) -> str:
    for entity in entities:
        dc = entity.device_class or entity.original_device_class
        if dc in device_classes:
            name = (entity.name or entity.original_name or entity.entity_id).lower()
            if any(kw in name for kw in keywords):
                return entity.entity_id
    return ""


def _build_schema(
    sensors: list[er.RegistryEntry],
    defaults: dict[str, Any] | None = None,
) -> vol.Schema:
    """Build the config flow schema, using defaults from an existing entry when reconfiguring."""

    def d(key: str, suggestion: str) -> str:
        if defaults and defaults.get(key):
            return defaults[key]
        return suggestion

    return vol.Schema({
        vol.Optional(CONF_SOLAR_POWER, default=d(
            CONF_SOLAR_POWER,
            _suggest_entity(sensors, [SensorDeviceClass.POWER], ["solar", "pv", "generation"]),
        )): str,
        # Battery: use EITHER battery_power (single signed sensor) OR charge + discharge.
        # If both are supplied, separate sensors take precedence.
        vol.Optional(CONF_BATTERY_POWER, default=d(
            CONF_BATTERY_POWER,
            _suggest_entity(sensors, [SensorDeviceClass.POWER], ["battery_power", "bat_power"]),
        )): str,
        vol.Optional(CONF_BATTERY_CHARGE_POWER, default=d(
            CONF_BATTERY_CHARGE_POWER,
            _suggest_entity(sensors, [SensorDeviceClass.POWER], ["battery_charge", "charge_power", "bat_charge"]),
        )): str,
        vol.Optional(CONF_BATTERY_DISCHARGE_POWER, default=d(
            CONF_BATTERY_DISCHARGE_POWER,
            _suggest_entity(sensors, [SensorDeviceClass.POWER], ["battery_discharge", "discharge_power", "bat_discharge"]),
        )): str,
        vol.Optional(CONF_BATTERY_SOC, default=d(
            CONF_BATTERY_SOC,
            _suggest_entity(sensors, [SensorDeviceClass.BATTERY], ["battery", "soc", "charge"]),
        )): str,
        # Grid: use EITHER grid_power (single signed sensor) OR import + export.
        # If both are supplied, separate sensors take precedence.
        vol.Optional(CONF_GRID_POWER, default=d(
            CONF_GRID_POWER,
            _suggest_entity(sensors, [SensorDeviceClass.POWER], ["grid_power", "net_power", "meter_power"]),
        )): str,
        vol.Optional(CONF_GRID_IMPORT_POWER, default=d(
            CONF_GRID_IMPORT_POWER,
            _suggest_entity(sensors, [SensorDeviceClass.POWER], ["grid_import", "power_from_grid", "import_power", "grid_in"]),
        )): str,
        vol.Optional(CONF_GRID_EXPORT_POWER, default=d(
            CONF_GRID_EXPORT_POWER,
            _suggest_entity(sensors, [SensorDeviceClass.POWER], ["grid_export", "power_to_grid", "export_power", "grid_out"]),
        )): str,
        vol.Optional(CONF_HOME_CONSUMPTION, default=d(
            CONF_HOME_CONSUMPTION,
            _suggest_entity(sensors, [SensorDeviceClass.POWER], ["load_power", "home", "house", "load", "consumption"]),
        )): str,
        vol.Optional(CONF_SOLAR_GENERATED_TODAY, default=d(
            CONF_SOLAR_GENERATED_TODAY,
            _suggest_entity(sensors, [SensorDeviceClass.ENERGY], ["pv_energy_today", "solar_energy_today", "pv_today", "generation_today"]),
        )): str,
        vol.Optional(CONF_BATTERY_CHARGED_TODAY, default=d(
            CONF_BATTERY_CHARGED_TODAY,
            _suggest_entity(sensors, [SensorDeviceClass.ENERGY], ["charge_energy_today", "battery_charge_today", "charged_today"]),
        )): str,
        vol.Optional(CONF_BATTERY_DISCHARGED_TODAY, default=d(
            CONF_BATTERY_DISCHARGED_TODAY,
            _suggest_entity(sensors, [SensorDeviceClass.ENERGY], ["discharge_energy_today", "battery_discharge_today", "discharged_today"]),
        )): str,
        vol.Optional(CONF_GRID_IMPORTED_TODAY, default=d(
            CONF_GRID_IMPORTED_TODAY,
            _suggest_entity(sensors, [SensorDeviceClass.ENERGY], ["energy_from_grid_today", "grid_import_today", "import_energy_today"]),
        )): str,
        vol.Optional(CONF_GRID_EXPORTED_TODAY, default=d(
            CONF_GRID_EXPORTED_TODAY,
            _suggest_entity(sensors, [SensorDeviceClass.ENERGY], ["energy_to_grid_today", "grid_export_today", "export_energy_today"]),
        )): str,
        vol.Optional(CONF_HOME_CONSUMED_TODAY, default=d(
            CONF_HOME_CONSUMED_TODAY,
            _suggest_entity(sensors, [SensorDeviceClass.ENERGY], ["load_consumption_today", "home_consumption_today", "consumed_today"]),
        )): str,
        vol.Optional(CONF_IMPORT_RATE, default=d(
            CONF_IMPORT_RATE,
            _suggest_entity(sensors, [SensorDeviceClass.MONETARY], ["import", "current_rate", "tariff"]),
        )): str,
        vol.Optional(CONF_EXPORT_RATE, default=d(
            CONF_EXPORT_RATE,
            _suggest_entity(sensors, [SensorDeviceClass.MONETARY], ["export", "feed", "export_rate"]),
        )): str,
        vol.Optional(CONF_CURRENCY, default=d(CONF_CURRENCY, "GBP")): str,
    })


class CardinalConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title="Cardinal", data=user_input)

        registry = er.async_get(self.hass)
        sensors = [e for e in registry.entities.values() if e.domain == "sensor"]

        return self.async_show_form(
            step_id="user",
            data_schema=_build_schema(sensors),
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        entry = self._get_reconfigure_entry()

        if user_input is not None:
            return self.async_update_reload_and_abort(
                entry,
                data_updates=user_input,
            )

        registry = er.async_get(self.hass)
        sensors = [e for e in registry.entities.values() if e.domain == "sensor"]

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=_build_schema(sensors, defaults=entry.data),
        )
