export namespace ISavingsCalculatorReq {
  export interface Address {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    latitude?: number;
    longitude?: number;
  }
}

export interface ISavingsCalculatorReq {
  historicalUsageByHour?: number[];
  historicalBillsByMonth?: number[];
  historicalProductionByHour?: number[];
  existingBatteryKwh?: number;
  additionalBatteryKwh?: number;
  preInstallTariff?: string;
  postInstallTariff?: string;
  batteryReservePercentage?: number;
  address?: ISavingsCalculatorReq.Address;
  usageProfile?: string;
  version?: number;
}
