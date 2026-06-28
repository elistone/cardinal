export type {
  SimulationBatteryConfig,
  GridChargeWindow,
  SimulationScenario,
  SimulatedPoint,
  SimulatedDay,
  DayState,
} from './types.js'

export { buildDay } from './engine.js'
export type { BuildDayOptions } from './engine.js'

export type {
  ScenarioParameters,
  SolarParameters,
  HomeLoadParameters,
  EvChargingParameters,
  BatteryParameters,
  TariffParameters,
  GridChargeParameters,
} from './parameters.js'
export { buildScenarioFromParameters } from './parameters.js'

export {
  solarBell,
  standardHomeProfile,
  withEvChargingWindow,
  flatTariff,
  touTariff,
} from './profiles.js'

export {
  SUNNY_SUMMER_DAY,
  CLOUDY_DAY,
  WINTER_DAY,
  STORM_NO_SOLAR,
  HEAVY_EVENING,
  EV_CHARGING_OVERNIGHT,
  BATTERY_CHARGING_THEN_EXPORTING,
  ALL_SCENARIOS,
} from './scenarios.js'
