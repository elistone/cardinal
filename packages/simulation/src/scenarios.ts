import type { SimulationScenario } from './types.js'
import {
  solarBell,
  standardHomeProfile,
  withEvChargingWindow,
  flatTariff,
  touTariff,
} from './profiles.js'

// ─── Shared constants ─────────────────────────────────────────────────────────

const STANDARD_BATTERY = {
  capacityKwh: 10,
  maxChargeRateWatts: 5000,
  maxDischargeRateWatts: 5000,
  efficiency: 0.92,
}

// UK summer (June): sunrise ~05:00, solar noon ~13:00, sunset ~21:00
const SUMMER_SUNRISE_T = 5 / 24
const SUMMER_SUNSET_T = 21 / 24

// UK winter (December): sunrise ~08:00, solar noon ~12:00, sunset ~16:00
const WINTER_SUNRISE_T = 8 / 24
const WINTER_SUNSET_T = 16 / 24

// Standard household: ~450 W overnight base, 1200 W morning peak, 2800 W evening peak.
// With a 10 kW peak home watt ceiling this produces realistic UK household numbers:
//   overnight ≈ 450 W, morning peak ≈ 1650 W, evening peak ≈ 3250 W.
const STANDARD_HOME = standardHomeProfile(450, 1200, 2800)

// ─── Scenarios ────────────────────────────────────────────────────────────────

/**
 * A clear June day with 5 kW peak solar and a 10 kWh battery starting at 20%.
 *
 * Expected arc:
 *  - Overnight: grid covers baseload, battery resting
 *  - Morning: solar charges battery while covering home
 *  - ~Midday: battery reaches 100%, surplus solar exports
 *  - Afternoon: solar covers home, battery idle
 *  - Evening: solar fades, battery discharges
 *  - Late night: battery exhausted, grid takes over
 */
export const SUNNY_SUMMER_DAY: SimulationScenario = {
  id: 'sunny-summer-day',
  name: 'Sunny Summer Day',
  description:
    'A clear summer day with 5 kW peak solar. Battery charges during the morning, ' +
    'reaches full by midday and exports surplus. Discharges through the evening.',
  battery: { ...STANDARD_BATTERY, initialChargePercent: 20 },
  solarProfile: solarBell(5000, SUMMER_SUNRISE_T, SUMMER_SUNSET_T),
  homeProfile: STANDARD_HOME,
  tariffs: flatTariff(0.245, 0.15),
}

/**
 * Overcast summer day: solar reaches only 40% of peak.
 *
 * The battery partially charges but home relies more heavily on grid import
 * throughout. A realistic outcome for a British summer.
 */
export const CLOUDY_DAY: SimulationScenario = {
  id: 'cloudy-day',
  name: 'Cloudy Day',
  description:
    'Overcast but not dark. Solar reaches only 40% of its clear-day peak. The ' +
    'battery partially charges but the home relies more on grid import than usual.',
  battery: { ...STANDARD_BATTERY, initialChargePercent: 30 },
  solarProfile: solarBell(2000, SUMMER_SUNRISE_T, SUMMER_SUNSET_T),
  homeProfile: STANDARD_HOME,
  tariffs: flatTariff(0.245, 0.15),
}

/**
 * Short winter day: solar only between 08:00 and 16:00, modest 1.8 kW peak.
 *
 * The home relies heavily on grid. Battery charges a little during the brief
 * solar window but does not reach full before solar ends.
 */
export const WINTER_DAY: SimulationScenario = {
  id: 'winter-day',
  name: 'Winter Day',
  description:
    'A short winter day. Solar generates between 08:00 and 16:00 only, with a ' +
    'modest 1.8 kW peak. Grid covers most of the home\'s demand throughout the day.',
  battery: { ...STANDARD_BATTERY, initialChargePercent: 15 },
  solarProfile: solarBell(1800, WINTER_SUNRISE_T, WINTER_SUNSET_T),
  homeProfile: STANDARD_HOME,
  tariffs: flatTariff(0.245, 0.15),
}

/**
 * Zero solar: storm or heavy cloud all day.
 *
 * Battery at 60% discharges to cover home load. Once empty (typically mid-morning
 * at normal consumption rates), the grid takes over completely.
 */
export const STORM_NO_SOLAR: SimulationScenario = {
  id: 'storm-no-solar',
  name: 'Storm — No Solar',
  description:
    'Zero solar generation all day. The battery discharges to cover home demand ' +
    'until empty, then the grid provides everything.',
  battery: { ...STANDARD_BATTERY, initialChargePercent: 60 },
  solarProfile: () => 0,
  homeProfile: STANDARD_HOME,
  tariffs: flatTariff(0.245, 0.15),
}

/**
 * Normal solar day with a much heavier evening peak.
 *
 * Evening demand reaches ~5 kW (cooking, dishwasher, electric heating). The
 * battery helps but cannot fully cover the peak, so the grid imports during
 * the evening even with a good solar day preceding it.
 */
export const HEAVY_EVENING: SimulationScenario = {
  id: 'heavy-evening',
  name: 'Heavy Evening Usage',
  description:
    'Good solar day, but evening demand reaches nearly 5 kW — cooking, ' +
    'dishwasher, and electric heating simultaneously. Battery helps but the ' +
    'grid still imports during the evening peak.',
  battery: { ...STANDARD_BATTERY, initialChargePercent: 25 },
  solarProfile: solarBell(4500, SUMMER_SUNRISE_T, SUMMER_SUNSET_T),
  homeProfile: standardHomeProfile(500, 1200, 4500),
  tariffs: flatTariff(0.245, 0.15),
}

/**
 * EV charging overnight at a cheap off-peak rate.
 *
 * A 7.2 kW EV charger runs from midnight to 07:00 and again from 23:30 to
 * midnight, representing a session that started the previous evening.  Solar
 * reduces grid import during the day.  Cheap rate applies during the EV window.
 */
export const EV_CHARGING_OVERNIGHT: SimulationScenario = {
  id: 'ev-charging-overnight',
  name: 'EV Charging Overnight',
  description:
    'A 7.2 kW EV charger runs from midnight to 07:00 at a cheap off-peak rate, ' +
    'and again from 23:30. Solar covers much of the daytime demand. Grid imports ' +
    'are dominated by the EV overnight.',
  battery: { ...STANDARD_BATTERY, initialChargePercent: 30 },
  solarProfile: solarBell(4500, SUMMER_SUNRISE_T, SUMMER_SUNSET_T),
  // EV runs 00:00–07:00 and 23:30–24:00 (spans midnight of the same day)
  homeProfile: withEvChargingWindow(
    withEvChargingWindow(STANDARD_HOME, 7200, 0, 7 / 24),
    7200,
    23.5 / 24,
    1,
  ),
  tariffs: touTariff(
    0.075,
    0.245,
    0.15,
    t => t >= 23.5 / 24 || t < 7 / 24,
  ),
}

/**
 * Battery charges from cheap-rate grid electricity overnight, then solar tops
 * it up.  By midday the battery is full and surplus solar exports to the grid.
 *
 * Demonstrates the Octopus-style arbitrage strategy: charge cheap, export or
 * self-consume at a higher rate during the day.
 */
export const BATTERY_CHARGING_THEN_EXPORTING: SimulationScenario = {
  id: 'battery-charging-then-exporting',
  name: 'Battery Charging, then Exporting',
  description:
    'Battery charges from cheap-rate grid electricity between 01:00 and 05:00, ' +
    'then solar tops it up. By midday the battery is full and surplus solar ' +
    'exports. Battery discharges through the evening.',
  battery: { ...STANDARD_BATTERY, initialChargePercent: 5 },
  solarProfile: solarBell(4500, SUMMER_SUNRISE_T, SUMMER_SUNSET_T),
  homeProfile: STANDARD_HOME,
  tariffs: touTariff(
    0.085,
    0.295,
    0.15,
    t => t >= 1 / 24 && t < 5 / 24,
  ),
  gridChargeWindows: [
    {
      startT: 1 / 24,
      endT: 5 / 24,
      chargeRateWatts: 3300,
    },
  ],
}

// ─── Catalogue ────────────────────────────────────────────────────────────────

export const ALL_SCENARIOS: ReadonlyArray<SimulationScenario> = [
  SUNNY_SUMMER_DAY,
  CLOUDY_DAY,
  WINTER_DAY,
  STORM_NO_SOLAR,
  HEAVY_EVENING,
  EV_CHARGING_OVERNIGHT,
  BATTERY_CHARGING_THEN_EXPORTING,
]
