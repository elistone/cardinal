from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.helpers import entity_registry as er

from .const import (
    CONF_BATTERY_CHARGE_POWER,
    CONF_BATTERY_DISCHARGE_POWER,
    CONF_BATTERY_SOC,
    CONF_CURRENCY,
    CONF_EXPORT_RATE,
    CONF_GRID_EXPORT_POWER,
    CONF_GRID_IMPORT_POWER,
    CONF_HOME_CONSUMPTION,
    CONF_IMPORT_RATE,
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


class CardinalConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title="Cardinal", data=user_input)

        registry = er.async_get(self.hass)
        sensors = [e for e in registry.entities.values() if e.domain == "sensor"]

        suggestions = {
            CONF_SOLAR_POWER: _suggest_entity(sensors, [SensorDeviceClass.POWER], ["solar", "pv", "generation"]),
            CONF_BATTERY_CHARGE_POWER: _suggest_entity(sensors, [SensorDeviceClass.POWER], ["battery_charge", "charge_power", "bat_charge"]),
            CONF_BATTERY_DISCHARGE_POWER: _suggest_entity(sensors, [SensorDeviceClass.POWER], ["battery_discharge", "discharge_power", "bat_discharge"]),
            CONF_BATTERY_SOC: _suggest_entity(sensors, [SensorDeviceClass.BATTERY], ["battery", "soc", "charge"]),
            CONF_GRID_IMPORT_POWER: _suggest_entity(sensors, [SensorDeviceClass.POWER], ["grid_import", "power_from_grid", "import_power", "grid_in"]),
            CONF_GRID_EXPORT_POWER: _suggest_entity(sensors, [SensorDeviceClass.POWER], ["grid_export", "power_to_grid", "export_power", "grid_out"]),
            CONF_HOME_CONSUMPTION: _suggest_entity(sensors, [SensorDeviceClass.POWER], ["load_power", "home", "house", "load", "consumption"]),
            CONF_IMPORT_RATE: _suggest_entity(sensors, [SensorDeviceClass.MONETARY], ["import", "current_rate", "tariff"]),
            CONF_EXPORT_RATE: _suggest_entity(sensors, [SensorDeviceClass.MONETARY], ["export", "feed", "export_rate"]),
            CONF_CURRENCY: "GBP",
        }

        schema = vol.Schema({
            vol.Optional(CONF_SOLAR_POWER, default=suggestions[CONF_SOLAR_POWER]): str,
            vol.Optional(CONF_BATTERY_CHARGE_POWER, default=suggestions[CONF_BATTERY_CHARGE_POWER]): str,
            vol.Optional(CONF_BATTERY_DISCHARGE_POWER, default=suggestions[CONF_BATTERY_DISCHARGE_POWER]): str,
            vol.Optional(CONF_BATTERY_SOC, default=suggestions[CONF_BATTERY_SOC]): str,
            vol.Optional(CONF_GRID_IMPORT_POWER, default=suggestions[CONF_GRID_IMPORT_POWER]): str,
            vol.Optional(CONF_GRID_EXPORT_POWER, default=suggestions[CONF_GRID_EXPORT_POWER]): str,
            vol.Optional(CONF_HOME_CONSUMPTION, default=suggestions[CONF_HOME_CONSUMPTION]): str,
            vol.Optional(CONF_IMPORT_RATE, default=suggestions[CONF_IMPORT_RATE]): str,
            vol.Optional(CONF_EXPORT_RATE, default=suggestions[CONF_EXPORT_RATE]): str,
            vol.Optional(CONF_CURRENCY, default=suggestions[CONF_CURRENCY]): str,
        })

        return self.async_show_form(step_id="user", data_schema=schema)
