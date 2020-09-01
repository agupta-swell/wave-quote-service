import { Document, Schema } from 'mongoose';

type LatLng = {
  lat: number;
  lng: number;
};

export const QUOTING = Symbol('Quoting').toString();

export interface Polygon {
  _id: Schema.Types.ObjectId;
  polygon: LatLng[];
  side: number;
  azimuth: number;
  panel_id: string;
  total_panels: number;
  panels: LatLng[][];
  keepouts: LatLng[][];
  roof_pitch: Number;
  row_spacing: Number;
  orientation: String;
  setbacks: Object;
}

export interface ILocation {
  address: string;
  latlng: LatLng;
}

export interface Quoting extends Document {
  name: string;
  polygons: Polygon[];
  location: ILocation;
  created_at: Date;
  updated_at: Date;
}

export const QuotingSchema = new Schema({
  name: String,
  polygons: [
    {
      _id: Schema.Types.ObjectId,
      polygon: [
        {
          lat: Number,
          lng: Number,
        },
      ],
      side: Number,
      azimuth: Number,
      panel_id: { type: Schema.Types.ObjectId, ref: 'SolarPanel', required: true },
      total_panels: Number,
      // FIXME: need to declare type in this
      panels: Schema.Types.Mixed,
      keepouts: [
        [
          {
            lat: Number,
            lng: Number,
          },
        ],
      ],
      roof_pitch: Number,
      row_spacing: Number,
      orientation: String,
      setbacks: Object,
      polygon_setbacks: [
        {
          lat: Number,
          lng: Number,
        },
      ],
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
