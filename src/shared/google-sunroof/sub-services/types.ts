
export type Color = [red: number, green: number, blue: number, alpha?: number];

export type Vector2 = [x: number, y: number];
export type Pixel = Vector2;
export type PixelPolygon = Pixel[]

export type LatLng = {
  lat: number,
  lng: number,
}

export type LatLngPolygon = LatLng[]
export type Panel = [LatLng, LatLng, LatLng, LatLng]

export type PanelArray = {
  bound_polygon: LatLngPolygon,
  panels: Panel[],
}

export type SystemDesign = {
  latitude: number,
  longitude: number,
  roof_top_design_data: {
    panel_array: PanelArray[],
  },
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
      roofSegmentStats: {
        pitchDegrees: number
        azimuthDegrees: number;
        center: LatitudeAndLongitude;
        boundingBox: BoundingBox;
      }[]
    }
  }

  // Note: Google Sunroof returns many more fields than are listed here.
  //       Only fields that are used by Wave are enumerated here.
  export interface SolarInfo {
    rgbUrl: string;
    maskUrl: string;
    annualFluxUrl: string;
    monthlyFluxUrl: string;
  }
}

/*
 * TODO Temp
 *
 * This is here temporarily. The type `ReadRasterResult` will be exported by GeoTIFF.js in version >=2.0.6.
 *
 * When we upgrade to geotiff@2.0.6, we can delete this block/namespace and fix any import(s).
 */
export namespace GeoTIFF {
  export type TypedArray = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array;

  export type ReadRasterResult = TypedArray[] & {
    height: number;
    width: number;
  };
}
