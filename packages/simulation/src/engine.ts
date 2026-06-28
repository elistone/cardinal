import type { EnergySnapshot, DailySummary } from '@cardinal/domain'
import type { SimulationScenario, SimulatedDay, SimulatedPoint } from './types.js'

const MINUTES_PER_DAY = 1440

function roundW(w: number): number {
  return Math.round(w)
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

/**
 * Pre-computes a complete simulated day at one-minute resolution.
 *
 * The engine enforces energy balance at every tick:
 *   solar + grid_import + battery_discharge = home + grid_export + battery_charge
 *
 * Priority order in surplus (solar > home):
 *   1. Charge battery (up to maxChargeRateWatts and available capacity)
 *   2. Export remainder to grid
 *
 * Priority order in deficit (solar < home):
 *   1. Discharge battery (up to maxDischargeRateWatts and stored energy)
 *   2. Import remainder from grid
 *
 * During a gridChargeWindow, the battery charges from the grid at the specified
 * rate, with solar reducing the grid import where possible.
 *
 * Battery efficiency applies only on the charge side (energy in × efficiency =
 * energy stored). Discharge is lossless in the model — a reasonable approximation
 * for round-trip efficiency typical of LFP batteries.
 */
export function buildDay(scenario: SimulationScenario, date: Date): SimulatedDay {
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)

  let batteryKwh =
    (scenario.battery.initialChargePercent / 100) * scenario.battery.capacityKwh

  // Running totals (energy flows as sensors report them, not efficiency-adjusted)
  let solarKwh = 0
  let importKwh = 0
  let exportKwh = 0
  let homeKwh = 0
  let chargedKwh = 0
  let dischargedKwh = 0

  const points: SimulatedPoint[] = []

  for (let minute = 0; minute < MINUTES_PER_DAY; minute++) {
    const timestamp = new Date(midnight.getTime() + minute * 60_000)
    const t = minute / MINUTES_PER_DAY

    const solarW = Math.max(0, scenario.solarProfile(t))
    const homeW = Math.max(0, scenario.homeProfile(t))
    const tariff = scenario.tariffs(t)

    let chargeW = 0
    let dischargeW = 0
    let importW = 0
    let exportW = 0

    // Maximum charge implied by remaining battery room this minute:
    //   room (Wh) × 60 (minutes/hour) = max watts sustainable for exactly 1 minute
    const batteryRoomW =
      Math.max(0, scenario.battery.capacityKwh - batteryKwh) * 1000 * 60

    const gridChargeWindow = scenario.gridChargeWindows?.find(
      w => t >= w.startT && t < w.endT,
    )

    if (gridChargeWindow !== undefined) {
      // Force-charge from grid. Solar reduces the grid draw where possible.
      chargeW = Math.min(
        gridChargeWindow.chargeRateWatts,
        scenario.battery.maxChargeRateWatts,
        batteryRoomW,
      )

      const solarForHome = Math.min(solarW, homeW)
      const gridForHome = homeW - solarForHome
      const remainingSolar = solarW - solarForHome
      const solarForCharge = Math.min(remainingSolar, chargeW)
      const gridForCharge = chargeW - solarForCharge

      importW = gridForHome + gridForCharge
      exportW = Math.max(0, remainingSolar - solarForCharge)
      dischargeW = 0
    } else {
      const net = solarW - homeW

      if (net >= 0) {
        // Surplus solar: charge battery first, export remainder
        chargeW = Math.min(net, scenario.battery.maxChargeRateWatts, batteryRoomW)
        exportW = net - chargeW
        importW = 0
        dischargeW = 0
      } else {
        // Deficit: discharge battery first, import remainder
        const batteryAvailableW = Math.max(0, batteryKwh) * 1000 * 60
        dischargeW = Math.min(
          -net,
          scenario.battery.maxDischargeRateWatts,
          batteryAvailableW,
        )
        importW = -net - dischargeW
        chargeW = 0
        exportW = 0
      }
    }

    // Integrate battery state for next tick.
    // Efficiency applies on the charge side only: the battery stores less than it receives.
    const energyStoredKwh = (chargeW / 60 / 1000) * scenario.battery.efficiency
    const energyDrawnKwh = dischargeW / 60 / 1000
    batteryKwh = Math.max(
      0,
      Math.min(scenario.battery.capacityKwh, batteryKwh + energyStoredKwh - energyDrawnKwh),
    )

    const chargePercent = (batteryKwh / scenario.battery.capacityKwh) * 100

    // Accumulate daily totals (power flows, as inverter sensors report them)
    solarKwh += solarW / 60 / 1000
    importKwh += importW / 60 / 1000
    exportKwh += exportW / 60 / 1000
    homeKwh += homeW / 60 / 1000
    chargedKwh += chargeW / 60 / 1000
    dischargedKwh += dischargeW / 60 / 1000

    const snapshot: EnergySnapshot = {
      timestamp,
      solar: {
        generatingWatts: roundW(solarW),
        isGenerating: solarW > 1,
      },
      battery: {
        chargePercent: Math.round(chargePercent * 10) / 10,
        chargingWatts: roundW(chargeW),
        dischargingWatts: roundW(dischargeW),
        isCharging: chargeW > 0,
        isDischarging: dischargeW > 0,
        isIdle: chargeW === 0 && dischargeW === 0,
      },
      grid: {
        importingWatts: roundW(importW),
        exportingWatts: roundW(exportW),
        isImporting: importW > 0,
        isExporting: exportW > 0,
        isIdle: importW === 0 && exportW === 0,
      },
      home: {
        consumingWatts: roundW(homeW),
      },
      tariffs: tariff,
    }

    const dailySummary: DailySummary = {
      date: midnight,
      solar: { generatedKwh: round3(solarKwh) },
      battery: { chargedKwh: round3(chargedKwh), dischargedKwh: round3(dischargedKwh) },
      grid: { importedKwh: round3(importKwh), exportedKwh: round3(exportKwh) },
      home: { consumedKwh: round3(homeKwh) },
    }

    points.push({ timestamp, snapshot, dailySummary })
  }

  return {
    scenario,
    date: midnight,
    points,
    at(timestamp: Date): SimulatedPoint {
      const minuteOfDay = Math.floor(
        (timestamp.getTime() - midnight.getTime()) / 60_000,
      )
      const index = Math.max(0, Math.min(MINUTES_PER_DAY - 1, minuteOfDay))
      return points[index]!
    },
  }
}
