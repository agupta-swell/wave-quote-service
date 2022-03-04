import { Document } from 'mongoose';

export interface ISeason {
  applicableMonths: number[];
  hourlyAllocation: number[];
}

export interface IUsageProfile {
  name: string;
  description: string;
  seasons: ISeason[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export type UsageProfileDocument = Document & IUsageProfile;
