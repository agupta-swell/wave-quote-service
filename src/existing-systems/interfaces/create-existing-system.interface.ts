import { IExistingSystemStorage, IExistingSystem, IExistingSystemArray } from './existing-system.interface';

export type CreateExistingSystemStorages = Omit<
  IExistingSystemStorage,
  'createdAt' | 'updatedAt' | 'manufacturerName'
> & {
  manufacturerName?: string;
};

export interface ICreateExistingSystem
  extends Omit<IExistingSystem, 'createdAt' | 'updatedAt' | 'array' | 'storages' | 'inverterManufacturerName'> {
  array: Omit<IExistingSystemArray, 'createdAt' | 'updatedAt'>[];
  storages: CreateExistingSystemStorages[];
  inverterManufacturerName?: string;
}
