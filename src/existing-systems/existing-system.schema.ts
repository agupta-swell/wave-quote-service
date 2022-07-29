import { Schema } from 'mongoose';
import { BatteryRatingSchema } from 'src/products-v2/schemas/rating.schema';

const ExistingPVArraySchema = new Schema(
  {
    existing_pv_azimuth: Number,
    existing_pv_pitch: Number,
    existing_pv_size: Number,
  },
  {
    _id: false,
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

const ExistingStorageSchema = new Schema(
  {
    battery_type: String,
    round_trip_efficiency: Number,
    manufacturer_id: Schema.Types.ObjectId,
    ratings: BatteryRatingSchema,
    name: String,
    year_installed: Number,
    purpose: String,
    manufacturer_name: String,
  },
  {
    _id: false,
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

export const ExistingSystemSchema = new Schema(
  {
    opportunity_id: String,
    has_granted_home_battery_system_rights: Boolean,
    has_had_other_demand_response_provider: Boolean,
    interconnected_with_existing_system: Boolean,
    original_installer: String,
    existing_pv_size: Number,
    year_system_installed: Number,
    inverter_type: String,
    finance_type: String,
    inverter_manufacturer_id: Schema.Types.ObjectId,
    inverter_manufacturer_name: String,
    inverter_model: String,
    array: [ExistingPVArraySchema],
    storages: [ExistingStorageSchema],
    tpo_funding_source: String,
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
