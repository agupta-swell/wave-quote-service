import { BATTERY_TYPE } from '../constants';

export interface IBattery {
  batteryType: BATTERY_TYPE;
  minimumReservePercentage: number;
  roundTripEfficiency: number;
  productImage?: string;
  productDataSheet?: string;
}

export interface IBatteryRating {
  kilowatts: number;
  kilowattHours: number;
}
