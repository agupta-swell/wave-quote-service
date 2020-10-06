import { ApiProperty } from '@nestjs/swagger';
import { INVERTER_TYPE } from '../../constants';
import { ProductDto } from './product.dto';

export class InverterDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: [INVERTER_TYPE.CENTRAL, INVERTER_TYPE.MICRO] })
  type: INVERTER_TYPE;

  @ApiProperty()
  inverterModelId: string;

  @ApiProperty({ type: ProductDto })
  inverterModelDataSnapshot: ProductDto;

  @ApiProperty()
  inverterModelSnapshotDate: Date;
}
