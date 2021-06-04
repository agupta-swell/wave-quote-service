import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';
import { GetRelatedInformationDto } from './get-related-information.dto';

export class UpdateOpportunityDto {
  @ExposeProp()
  contactId: string;

  @ExposeProp()
  utilityId: string;

  @ExposeProp()
  utilityProgramId: string;

  @ExposeProp()
  rebateProgramId: string;

  @ExposeProp()
  fundingSourceId: string;

  @ExposeProp()
  contractorCompanyName: string;

  @ExposeProp()
  contractorAddress1: string;

  @ExposeProp()
  contractorAddress2: string;

  @ExposeProp()
  contractorLicense: string;

  @ExposeProp()
  amount: number;

  @ExposeProp()
  isPrimeContractor: boolean;

  @ExposeProp()
  contractorEmail: string;

  @ExposeProp()
  contractorSigner: string;

  @ExposeProp()
  recordOwner: string;

  @ExposeProp()
  accountId: string;
}

export class UpdateOpportunityRes implements ServiceResponse<GetRelatedInformationDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetRelatedInformationDto })
  data: GetRelatedInformationDto;
}
