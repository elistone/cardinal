export interface EntityMapping {
  solarPower?: string;

  // Battery: provide either a single signed sensor (positive = charging)
  // OR separate charge and discharge sensors (e.g. LuxPower Modbus).
  batteryPower?: string;
  batteryChargePower?: string;
  batteryDischargePower?: string;
  batteryStateOfCharge?: string;

  // Grid: provide either a single signed sensor (positive = importing)
  // OR separate import and export sensors (e.g. LuxPower Modbus).
  gridPower?: string;
  gridImportPower?: string;
  gridExportPower?: string;

  homeConsumption?: string;
  importRate?: string;
  exportRate?: string;
  currency?: string;
}
