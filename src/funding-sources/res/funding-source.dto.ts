import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class FundingSourceDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  type: string;

  @ExposeProp()
  rebateAssignment: string;
}
