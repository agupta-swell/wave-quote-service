import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class FeatureFlagDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  value: string;

  @ExposeProp()
  description: string;

  @ExposeProp()
  isEnabled: boolean;
}
