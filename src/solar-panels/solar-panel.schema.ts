import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({})
export class SolarPanel extends Document {
  @Prop()
  name: string;

  @Prop()
  width: number;

  @Prop()
  length: number;

  @Prop()
  unit: string;

}

export const SolarPanelSchema = SchemaFactory.createForClass(SolarPanel);
