import { Document, Schema } from 'mongoose';

export const FMV_APPRAISAL = Symbol('FMV_APPRAISAL').toString();

export interface FmvAppraisal extends Document {
    _id: string,
    name: string,
    endDate: Date,
    projectTypes: string[],
    utilityIds: string[],
    regionIds: string[],
    taxCreditConfigIds: string[],
    solarManufacturerIds: string[],
    inverterManufacturerIds: string[],
    energyStorageManufacturerIds: string[],
    escalator: number,
    effectiveDate: Date,
    fundId: string,
    solarRatePerKw: number,
    stateCode: string,
    storageRatePerKwh: number,
    usedByTranches: boolean,
    termYears: number,
    createdAt: Date,
    modifiedAt: Date,
  }

export const FmvAppraisalSchema = new Schema<FmvAppraisal>(
    {
        name: String,
        endDate: Date,
        projectTypes: [String],
        utilityIds: [String],
        regionIds: [String],
        taxCreditConfigIds: [String],
        solarManufacturerIds: [String],
        inverterManufacturerIds: [String],
        energyStorageManufacturerIds: [String],
        escalator: Number,
        effectiveDate: Date,
        fundId: String,
        solarRatePerKw: Number,
        stateCode: String,
        storageRatePerKwh: Number,
        usedByTranches: Boolean,
        termYears: Number,
        createdAt: Date,
        modifiedAt: Date,
    },
    { _id: false },
);
