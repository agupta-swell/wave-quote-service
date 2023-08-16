import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';

export class ProgressDto {
  @ExposeProp()
  utilityAndUsageCounter: number;

  @ExposeProp()
  systemDesignCounter: number;

  @ExposeProp()
  quoteCounter: number;

  @ExposeProp()
  quoteCounterForEnablingQualificationTab: number;

  @ExposeProp()
  proposalCounter: number;

  @ExposeProp()
  qualificationCounter: number;
}

export class ProgressRes implements ServiceResponse<ProgressDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ProgressDto })
  data: ProgressDto;
}
