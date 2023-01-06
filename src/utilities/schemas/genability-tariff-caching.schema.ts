import { Document, Schema } from 'mongoose';

export const GENABILITY_TARIFF_DATA = 'v2_genability_tariff_data';

export const GenabilityTariffDataDetailSchema = new Schema(
  {
    tariff_code: String,
    master_tariff_id: String,
    tariff_name: String,
    zip_code: Number,
  },
  {
    _id: false,
  },
);

export const GenabilityTariffDataSchema = new Schema({
  zip_code: Number,
  lse_id: String,
  lse_name: String,
  tariff_details: [GenabilityTariffDataDetailSchema],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export interface GenabilityTariffDataDetail extends Document {
  tariffCode: string;
  masterTariffId: string;
  tariffName: string;
}

export interface GenabilityTeriffData extends Document {
  zipCode: number;
  lseId: string;
  lseName: string;
  tariffDetails: GenabilityTariffDataDetail[];
}
