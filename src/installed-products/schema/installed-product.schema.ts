import { Schema } from 'mongoose';

export const InstalledProductSchema = new Schema(
  {
    opportunity_id: String,
    project_id: String,
    gs_opportunity_id: String,
    product_id: String,
    array_index: Number,
    quantity: Number,
    part_number: String,
    serial_number: String,
    notes: String,
    created_by: String,
    updated_by: String,
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
