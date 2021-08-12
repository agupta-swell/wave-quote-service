import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { ProductDto } from './product.dto';
import { SystemProductionDto } from './system-production.dto';

export class CapacityPanelArrayResDto {
  @ExposeAndMap({}, ({ obj }) => obj.arrayId)
  arrayId: string;

  @ExposeProp()
  panelModelId: string;

  @ExposeProp()
  capacity: number;

  @ExposeProp()
  production: number;

  @ExposeProp()
  pitch: number;

  @ExposeProp()
  azimuth: number;

  @ExposeProp({ type: ProductDto })
  panelModelDataSnapshot: ProductDto;

  @ExposeProp()
  panelModelSnapshotDate: Date;

  @ExposeProp()
  numberOfPanels: number;

  @ExposeProp()
  losses: number;

  @ExposeProp({ type: SystemProductionDto })
  systemProductionData: SystemProductionDto;
}
