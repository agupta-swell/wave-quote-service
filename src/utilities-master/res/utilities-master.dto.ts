import { ApiProperty } from '@nestjs/swagger';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class UtilitiesMasterResDto {
  @ExposeMongoId({ eitherId: true })
  id: string;

  @ApiProperty()
  @ExposeProp()
  utilityName: string;
}
