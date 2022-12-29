import { IEnergyProfileProduction } from 'src/system-production/system-production.schema';
import { IHistoricalUsage } from 'src/utilities/res';
import { roundNumber } from 'src/utils/transformNumber';

export const getNetLoadTypical24Hours = (
  expectedUsage: number[],
  newPV: number[],
  batteryChargingSeriesTypical: number[],
  batteryDischargingSeriesTypical: number[],
): number[] => {
  const netLoadTypical24Hours: number[] = [];
  for (let i = 0; i < 25; i += 1) {
    const expectedUsagePerHour = expectedUsage?.[i] || 0;
    const newPVPerHour = newPV?.[i] || 0;
    const batteryChargingSeriesTypicalPerHour = batteryChargingSeriesTypical?.[i] || 0;
    const batteryDischargingSeriesTypicalPerHour = batteryDischargingSeriesTypical?.[i] || 0;
    const result = roundNumber(
      expectedUsagePerHour -
        newPVPerHour +
        Math.abs(batteryChargingSeriesTypicalPerHour) -
        Math.abs(batteryDischargingSeriesTypicalPerHour),
      2,
    );
    netLoadTypical24Hours.push(result);
  }
  return netLoadTypical24Hours;
};

export const getNetLoadTypical = (
  expectedUsage: IHistoricalUsage,
  newPV: IEnergyProfileProduction,
  batteryChargingSeriesTypical: IEnergyProfileProduction,
  batteryDischargingSeriesTypical: IEnergyProfileProduction,
): IEnergyProfileProduction => {
  const netLoadTypicalAnnual: number[] = getNetLoadTypical24Hours(
    expectedUsage.annualUsage,
    newPV.annualAverage,
    batteryChargingSeriesTypical.annualAverage,
    batteryDischargingSeriesTypical.annualAverage,
  );
  const netLoadTypicalMonthly: number[][] = [];
  for (let i = 0; i < 12; i += 1) {
    const netLoadTypical24Hours = getNetLoadTypical24Hours(
      expectedUsage.monthlyUsage[i],
      newPV.monthlyAverage[i],
      batteryChargingSeriesTypical.monthlyAverage[i],
      batteryDischargingSeriesTypical.monthlyAverage[i],
    );
    netLoadTypicalMonthly.push(netLoadTypical24Hours);
  }
  return {
    annualAverage: netLoadTypicalAnnual,
    monthlyAverage: netLoadTypicalMonthly,
  };
};
