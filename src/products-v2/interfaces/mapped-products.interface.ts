import { PRODUCT_TYPE } from '../constants';
import { IBattery, IBatteryRating } from './battery.interface';
import { IComponent } from './component.interface';
import { IInverter } from './inverter.interface';
import { IManufacturer } from './manufacturer.interface';
import { IModule } from './module.interface';
import { IPricing } from './pricing.interface';
import { IRating } from './rating.interface';

type IBaseMappedProductTypes = {
  [K in PRODUCT_TYPE]: object;
};

export interface IMappedProductTypes extends IBaseMappedProductTypes {
  [PRODUCT_TYPE.ADDER]: IPricing;
  [PRODUCT_TYPE.ANCILLARY_EQUIPMENT]: IComponent & IManufacturer & {
    averageWholeSalePrice: number // TODO WAV-903 Missing averageWholeSalePrice
  };
  [PRODUCT_TYPE.BALANCE_OF_SYSTEM]: IPricing & IComponent;
  [PRODUCT_TYPE.BATTERY]: IBattery & IManufacturer & IRating<IBatteryRating>;
  [PRODUCT_TYPE.INVERTER]: IInverter & IManufacturer & IRating;
  [PRODUCT_TYPE.MODULE]: IModule & IManufacturer & IRating;
}
