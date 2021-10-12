import { Document } from 'mongoose';
import { PRODUCT_TYPE } from '../constants';
import { IMappedProductTypes } from './mapped-products.interface';
import { IBaseRating, IRating } from './rating.interface';

export interface IBaseProduct {
  _id: string;
  name: string;
  type: PRODUCT_TYPE;
  partNumbers?: string[];
  createdAt: Date;
  createdBy: String;
  updatedAt?: Date;
  updatedBy?: String;

  price: number // TOTO WAV-903 missing price field
}

export type IProduct<T = unknown> = T extends PRODUCT_TYPE
  ? IBaseProduct & { type: T } & IMappedProductTypes[T]
  : IBaseProduct;

export type IProductDocument<T> = IProduct<T> & Document;

export interface IUnknownProduct
  extends Document,
    Omit<IBaseProduct, '_id'>,
    Partial<IMappedProductTypes[PRODUCT_TYPE.ADDER]>,
    Partial<IMappedProductTypes[PRODUCT_TYPE.ANCILLARY_EQUIPMENT]>,
    Partial<IMappedProductTypes[PRODUCT_TYPE.BALANCE_OF_SYSTEM]>,
    Partial<IMappedProductTypes[PRODUCT_TYPE.INVERTER]>,
    Partial<IMappedProductTypes[PRODUCT_TYPE.MODULE]>,
    Partial<IRating>,
    Partial<IRating<IBaseRating>> {}

export type ISnapshotProductDocument<T> = Omit<IProductDocument<T>, '_id'>;
export type ISnapshotProduct<T> = Omit<IProduct<T>, '_id'>;
