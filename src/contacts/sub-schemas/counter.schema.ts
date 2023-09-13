import { Schema } from 'mongoose';

export const COUNTER = Symbol('COUNTER').toString();

export interface Counter extends Document {
  nextVal: number;
}

export const CounterSchema = new Schema<Counter>({
  _id: Schema.Types.Mixed,
  next_val: Number,
});
