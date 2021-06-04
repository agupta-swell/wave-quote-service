import { ExposeProp } from 'src/shared/decorators';

export class UpdateOpportunityUtilityProgramDto {
  @ExposeProp()
  utilityProgramId: string;

  @ExposeProp()
  opportunityId: string;
}
