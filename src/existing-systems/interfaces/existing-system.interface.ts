import { Document, ObjectId } from 'mongoose';
import { INVERTER_TYPE, PRODUCT_TYPE } from 'src/products-v2/constants';
import { IProduct } from 'src/products-v2/interfaces';
import { FINANCE_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';

type WithId<T> = T & { readonly _id: ObjectId };

export interface IExistingSystemStorage
  extends Pick<IProduct<PRODUCT_TYPE.BATTERY>, 'batteryType' | 'ratings'>,
    Partial<Pick<IProduct<PRODUCT_TYPE.BATTERY>, 'name' | 'roundTripEfficiency'>> {
  yearInstalled: number;
  purpose: string;
  manufacturerId?: ObjectId;
  readonly manufacturerName?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IExistingSystemArray {
  existingPVAzimuth?: number;
  existingPVPitch?: number;
  existingPVSize: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IExistingSystem {
  opportunityId: string;
  hasGrantedHomeBatterySystemRights: boolean;
  hasHadOtherDemandResponseProvider: boolean;
  interconnectedWithExistingSystem: boolean;
  originalInstaller: string;
  existingPVSize: number;
  yearSystemInstalled: number;
  inverterType: INVERTER_TYPE;
  financeType: FINANCE_TYPE_EXISTING_SOLAR;
  inverterManufacturerId: ObjectId | null;
  inverterModel: string;
  tpoFundingSource?: string;
  array: IExistingSystemArray[];
  storages: IExistingSystemStorage[];
  readonly inverterManufacturerName?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type StorageDocument = Document & IExistingSystemStorage;

export type ArrayDocument = Document & IExistingSystemArray;

export type ExistingSystemDocument = Document &
  WithId<Omit<IExistingSystem, 'array' | 'storages'>> & {
    array: ArrayDocument[];
    storages: StorageDocument[];
  };
