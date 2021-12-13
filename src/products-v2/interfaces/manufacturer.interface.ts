import { ObjectId } from 'mongoose';

export interface IManufacturer {
  manufacturerId: ObjectId;
  manufacturer?: string;
}
