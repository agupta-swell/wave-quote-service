import { Schema } from 'mongoose';
import { ElectricVehicleSchema } from './electric-vehicle.schema';

export const ElectricVehicleSnapshotSchema = new Schema(
  {
    electric_vehicle_id: String,
    electric_vehicle_snapshot_date: Date,
    electric_vehicle_snapshot: new Schema({ ...ElectricVehicleSchema.obj }, { _id: false }),
    miles_driven_per_day: Number,
    start_charging_hour: Number,
    charger_type: new Schema({
      name: String,
      rating: Number,
    }, {_id: false})
  },
  {
    _id: false,
  },
);
