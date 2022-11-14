import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { ORIENTATION } from '../../constants';
import { ProductResDto } from '../../../products-v2/res/product.dto';

export class LatLng {
  @ExposeProp()
  lat: number;

  @ExposeProp()
  lng: number;
}

export class SolarPanelArrayDto {
  @ExposeAndMap({}, ({ obj }) => obj.arrayId)
  arrayId: string;

  @ExposeProp()
  primaryOrientationSide: number;

  @ExposeProp()
  panelOrientation: ORIENTATION;

  @ExposeProp({ isArray: true, type: LatLng })
  boundPolygon: LatLng[];

  @ExposeAndMap(
    {
      type: 'array',
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
        },
      },
      skipTransform: true,
    },
    ({ obj }) => obj.panels,
  )
  panels: LatLng[][];

  @ExposeProp()
  panelModelId: string;

  @ExposeProp({ required: false })
  setbacks: Map<string, number>;

  @ExposeProp({ isArray: true, type: LatLng, required: false })
  setbacksPolygon: LatLng[];

  @ExposeProp()
  pitch: number;

  @ExposeProp()
  azimuth: number;

  @ExposeProp({ required: false })
  rowSpacing: number;

  @ExposeProp({ type: ProductResDto })
  panelModelDataSnapshot: ProductResDto;

  @ExposeProp()
  panelModelSnapshotDate: Date;

  @ExposeProp()
  numberOfPanels: number;

  @ExposeProp()
  losses: number;

  @ExposeProp()
  useSunroof: boolean;

  @ExposeProp()
  sunroofPrimaryOrientationSide?: number;

  @ExposeProp()
  sunroofPitch?: number;

  @ExposeProp()
  sunroofAzimuth?: number;
  
  @ExposeProp()
  overrideRooftopDetails?: boolean;
}
