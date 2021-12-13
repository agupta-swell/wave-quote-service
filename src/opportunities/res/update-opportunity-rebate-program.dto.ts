import { ExposeProp } from 'src/shared/decorators';

export class UpdateOpportunityRebateProgramDto {
  @ExposeProp()
  rebateProgramId: string;

  @ExposeProp()
  opportunityId: string;
}
