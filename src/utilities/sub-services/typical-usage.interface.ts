import { IElectricVehicleSnapshot } from 'src/electric-vehicles/interfaces';

export interface IBaseUsage {
  v: number;
}

export type FixedArray<N extends number, T> = N extends 0
  ? never[]
  : {
      0: T;
      length: N;
    } & ReadonlyArray<T>;

/**
 * The 1st element of the array is the typical usage calculated by the weighted average of the usage of each month.
 *
 * The rests are monthly typical usage calculated by the weighted average of the usage of each day.
 */
export type TypicalUsageKwh = FixedArray<13, number[]>;

export type WithAvgUsage<T extends IBaseUsage> = T & { avg: number };
export type WithSeason<T extends IBaseUsage> = T & { typicalUsages: number[] };

export interface IGetTypicalUsageKwh {
  annualConsumption: number;
  usage: TypicalUsageKwh;
  increasePercentage: number;
  increaseAmount: number;
  poolUsageKwh: number;
  electricVehicles: IElectricVehicleSnapshot[];
}

export type BaseTypicalUsageConstructor<T extends IGetTypicalUsageKwh, R> = {
  new (props: T, ...args: any[]): R;
};
