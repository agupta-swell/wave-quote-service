export type Color = [red: number, green: number, blue: number, alpha?: number];

export type Vector2 = [x: number, y: number];
export type Pixel = Vector2;
export type PixelPolygon = Pixel[];

export type LatLng = {
  lat: number;
  lng: number;
};

export type LatLngPolygon = LatLng[];

type Production = {
  annualProduction: number;
  monthlyProduction: number[];
};

export type ArrayProduction = Production & {
  arrayId: string;
};

export type SystemProduction = Production & {
  byArray: ArrayProduction[];
};

export interface IClosestBuildingKey {
  key: string;
}

export interface IDriftCorrection {
  x: number;
  y: number;
}

export namespace GoogleSunroof {
  // Helpers
  export interface LatitudeAndLongitude {
    latitude: number;
    longitude: number;
  }
  export interface BoundingBox {
    sw: LatitudeAndLongitude;
    ne: LatitudeAndLongitude;
  }

  // Note: Google Sunroof returns many more fields than are listed here.
  //       Only fields that are used by Wave are enumerated here.
  export interface Building {
    solarPotential: {
      roofSegmentStats: RoofSegmentStats[];
    };
  }

  export interface RoofSegmentStats {
    pitchDegrees: number;
    azimuthDegrees: number;
    center: LatitudeAndLongitude;
    boundingBox: BoundingBox;
  }

  // Note: Google Sunroof returns many more fields than are listed here.
  //       Only fields that are used by Wave are enumerated here.
  export interface SolarInfo {
    rgbUrl: string;
    maskUrl: string;
    annualFluxUrl: string;
    monthlyFluxUrl: string;
  }

  export interface IFindClosestBuildingParams {
    'location.latitude': number;
    'location.longitude': number;
    key: string;
  }

  export interface IGetSolarInfoParams {
    'location.latitude': number;
    'location.longitude': number;
    radiusMeters: number;
    key: string;
  }
}

export interface BoundingBox {
  sw: GoogleSunroof.LatitudeAndLongitude;
  ne: GoogleSunroof.LatitudeAndLongitude;
  azimuthDegrees: number;
  pitchDegrees: number;
  sunroofPrimaryOrientationSide: number;
}

export type GoogleSunroofOrientationInformation = {
  sunroofPrimaryOrientationSide?: number;
  sunroofPitch?: number;
  sunroofAzimuth?: number;
  boundingBoxes?: BoundingBox[];
};
