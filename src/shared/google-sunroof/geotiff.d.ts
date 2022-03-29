declare module 'geotiff' {
  type TypedArray = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array;

  type ReadRasterResult = TypedArray[] & {
    height: number;
    width: number;
  };

  type GeoTIFF = {
    readRasters(): Promise<ReadRasterResult>;
  };

  export function fromArrayBuffer (buffer: ArrayBuffer): Promise<GeoTIFF>;
}
