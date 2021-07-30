import { ApiProperty } from '@nestjs/swagger';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class UtilityMasterResDto {
  @ExposeMongoId({ eitherId: true })
  id: string;

  @ApiProperty()
  @ExposeProp()
  utilityName: string;

  @ExposeProp()
  lseId: string;
}
