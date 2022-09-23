import { IEnergyProfileProduction } from 'src/system-production/system-production.schema';
import { IHistoricalUsage } from 'src/utilities/res';
import { roundNumber } from 'src/utils/transformNumber';

export const getNetLoadTypical24Hours = (
  expectedUsage: number[],
  existingPV: number[],
  newPV: number[],
  batteryChargingSeriesTypical: number[],
  batteryDischargingSeriesTypical: number[],
): number[] => {
  const netLoadTypical24Hours: number[] = [];
  for (let i = 0; i < 25; i += 1) {
    const expectedUsageAnnual = expectedUsage?.[i] || 0;
    const existingPVAnnual = existingPV?.[i] || 0;
    const newPVAnnual = newPV?.[i] || 0;
    const batteryChargingSeriesTypicalAnnual = batteryChargingSeriesTypical?.[i] || 0;
    const batteryDischargingSeriesTypicalAnnual = batteryDischargingSeriesTypical?.[i] || 0;
    const result = roundNumber(
      expectedUsageAnnual -
        (existingPVAnnual + newPVAnnual) +
        Math.abs(batteryChargingSeriesTypicalAnnual) -
        Math.abs(batteryDischargingSeriesTypicalAnnual),
      2,
    );
    netLoadTypical24Hours.push(result);
  }
  return netLoadTypical24Hours;
};

export const getNetLoadTypical = (
  expectedUsage: IHistoricalUsage,
  existingPV: IEnergyProfileProduction,
  newPV: IEnergyProfileProduction,
  batteryChargingSeriesTypical: IEnergyProfileProduction,
  batteryDischargingSeriesTypical: IEnergyProfileProduction,
): IEnergyProfileProduction => {
  const netLoadTypicalAnnual: number[] = getNetLoadTypical24Hours(
    expectedUsage.annualUsage,
    existingPV.annualAverage,
    newPV.annualAverage,
    batteryChargingSeriesTypical.annualAverage,
    batteryDischargingSeriesTypical.annualAverage,
  );
  const netLoadTypicalMonthly: number[][] = [];
  for (let i = 0; i < 12; i += 1) {
    const netLoadTypical24Hours = getNetLoadTypical24Hours(
      expectedUsage.monthlyUsage[i],
      existingPV.monthlyAverage[i],
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
