export interface PowerReading {
  watts: number;
}

export interface BatteryState {
  power: PowerReading;
  stateOfCharge: number;
  isCharging: boolean;
  isDischarging: boolean;
  isIdle: boolean;
}

export interface GridState {
  power: PowerReading;
  isImporting: boolean;
  isExporting: boolean;
}

export interface EnergySnapshot {
  timestamp: Date;
  solar: PowerReading;
  battery: BatteryState;
  grid: GridState;
  home: PowerReading;
}
