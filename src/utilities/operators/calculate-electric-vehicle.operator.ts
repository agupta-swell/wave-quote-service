/* eslint-disable no-plusplus */
import { map } from 'rxjs/operators';
import { roundNumber } from 'src/utils/transformNumber';
import { IGetTypicalUsageKwh, TypicalUsageKwh } from '../sub-services';

export const roundUpNumber = (num: number) => {
  const integerValue = Math.floor(num);
  const decimalValue = roundNumber(num - integerValue, 2);
  if (decimalValue >= 0.5) return integerValue + 1;
  return integerValue;
};

export const calculateElectricVehicle = map<IGetTypicalUsageKwh, IGetTypicalUsageKwh>(res => {
  const { usage, electricVehicles, ...p } = res;

  if (!electricVehicles.length) return res;

  const everyElectricVehicleKwh: number[][] = [];

  electricVehicles.forEach(e => {
    const {
      chargerType,
      milesDrivenPerDay,
      startChargingHour,
      electricVehicleSnapshot: { kwhPer100Miles },
    } = e;

    const hourlyUsage = Array(24).fill(0);

    const chargingRate = chargerType.rating;

    const kwhRequiredPerDay = roundNumber(milesDrivenPerDay * (kwhPer100Miles / 100), 2);

    if (kwhRequiredPerDay < chargingRate) {
      hourlyUsage[startChargingHour] = kwhRequiredPerDay;
    } else {
      let kwhRequiredPerDayRemaining = kwhRequiredPerDay;
      const hoursAmount = roundUpNumber(kwhRequiredPerDay / chargingRate);
      const hoursLength = 24 + hoursAmount;
      // eslint-disable-next-line no-plusplus
      for (let i = startChargingHour; i < hoursLength; ++i) {
        const index = i % 24;
        hourlyUsage[index] = roundNumber(
          hourlyUsage[index] + kwhRequiredPerDayRemaining > chargingRate ? chargingRate : kwhRequiredPerDayRemaining,
          2,
        );
        if (kwhRequiredPerDayRemaining > chargingRate) {
          kwhRequiredPerDayRemaining = roundNumber(kwhRequiredPerDayRemaining - chargingRate, 2);
        } else {
          break;
        }
      }
    }
    everyElectricVehicleKwh.push(hourlyUsage);
  });

  const singleElectricVehicleKwh = everyElectricVehicleKwh.reduce((acc, cur) => acc.concat(cur), []);
  const singleElectricVehicleKwhLength = singleElectricVehicleKwh.length;
  const sumSingleElectricVehicleKwh: number[] = [];

  for (let i = 0; i < singleElectricVehicleKwhLength; ++i) {
    const index = i % 24;
    sumSingleElectricVehicleKwh[index] = (sumSingleElectricVehicleKwh[index] || 0) + singleElectricVehicleKwh[i];
  }
  sumSingleElectricVehicleKwh.push(sumSingleElectricVehicleKwh[0]);

  const newUsage = (usage.map(u1 =>
    u1.map((u2, i2) => roundNumber(u2 + sumSingleElectricVehicleKwh[i2], 2)),
  ) as unknown) as TypicalUsageKwh;

  return {
    ...p,
    electricVehicles,
    usage: newUsage,
  };
});
