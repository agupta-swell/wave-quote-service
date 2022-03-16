declare module 'geotiff' {
  type Layer = number[];

  type Layers = Layer[] & {
    height: number;
    width: number;
  };

  type GeoTIFF = {
    readRasters(): Promise<Layers>;
  };

  export function fromFile(filename: string): Promise<GeoTIFF>;
}
