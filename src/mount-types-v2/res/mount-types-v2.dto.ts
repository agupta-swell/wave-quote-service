import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class MountTypesDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  deratePercentage: number;
}
