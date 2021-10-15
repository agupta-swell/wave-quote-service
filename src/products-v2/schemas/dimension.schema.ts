import { Schema } from 'mongoose';

export const DimensionSchema = new Schema(
  {
    length: Number,
    width: Number,
  },
  { _id: false },
);
