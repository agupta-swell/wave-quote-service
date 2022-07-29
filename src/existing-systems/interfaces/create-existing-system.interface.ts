import { INVERTER_TYPE } from 'src/products-v2/constants';
import { IExistingSystem, IExistingSystemArray, IExistingSystemStorage } from './existing-system.interface';

export type CreateExistingSystemStorages = Omit<
  IExistingSystemStorage,
  'createdAt' | 'updatedAt' | 'manufacturerName'
> & {
  manufacturerName?: string;
};

export interface ICreateExistingSystem
  extends Omit<
    IExistingSystem,
    'createdAt' | 'updatedAt' | 'array' | 'storages' | 'inverterManufacturerName' | 'inverterType'
  > {
  array: Omit<IExistingSystemArray, 'createdAt' | 'updatedAt'>[];
  storages: CreateExistingSystemStorages[];
  inverterManufacturerName?: string;
  inverterType?: INVERTER_TYPE;
}
