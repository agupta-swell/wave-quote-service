import { Document, Schema } from 'mongoose';

type LatLng = {
  lat: number;
  lng: number;
};

export const QUOTING = Symbol('Quoting').toString();

export interface Polygon {
  readonly polygon: [LatLng];
  readonly side: number;
  readonly azimuth: number;
  readonly panel: any;
  readonly total_panels: number;
  readonly panels: any;
}

export interface Quoting extends Document {
  readonly name: string;
  readonly polygons: Polygon[];
  readonly location: any;
  readonly created_at: Date;
  readonly updated_at: Date;
}

export const QuotingSchema = new Schema({
  name: String,
  polygons: [
    {
      polygon: [
        {
          lat: Number,
          lng: Number,
        },
      ],
      side: Number,
      azimuth: Number,
      panel: { type: Schema.Types.ObjectId, ref: 'SolarPanel', required: true },
      total_panels: Number,
      // FIXME: need to declare type in this
      panels: Schema.Types.Mixed,
    },
  ],
  location: {
    address: String,
    latlng: {
      lat: Number,
      lng: Number,
    },
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
