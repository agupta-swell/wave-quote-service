import { Document, Schema } from 'mongoose';

export const GENEBILITY_TARIFF_DATA = 'v2_genability_tariff_data';

export const GenebilityTariffDataDetailSchema = new Schema(
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

export const GenebilityTariffDataSchema = new Schema({
  zip_code: Number,
  lse_id: String,
  lse_name: String,
  tariff_details: [GenebilityTariffDataDetailSchema],
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

export interface GenebilityTariffDataDetail extends Document {
  tariff_code: string;
  master_tariff_id: string;
  tariff_name: string;
}

export interface GenebilityTeriffData extends Document {
  zip_code: number;
  lse_id: string;
  lse_name: string;
  tariff_details: GenebilityTariffDataDetail[];
}
