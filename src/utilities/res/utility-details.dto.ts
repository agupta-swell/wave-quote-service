import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { CostDataDto } from './cost-data.dto';
import { UtilityDataDto } from './utility-data.dto';

export class UtilityDetailsDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  opportunityId: string;

  @ExposeProp({ type: UtilityDataDto })
  utilityData: UtilityDataDto;

  @ExposeProp({ type: CostDataDto })
  costData: CostDataDto;
}
