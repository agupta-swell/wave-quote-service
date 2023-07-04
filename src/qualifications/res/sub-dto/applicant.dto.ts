import { IsOptional } from 'class-validator';
import { APPLICANT_TYPE } from 'src/qualifications/constants';
import { ExposeProp } from 'src/shared/decorators';

export class ApplicantDto {
  @ExposeProp()
  contactId: string;

  @ExposeProp()
  type: APPLICANT_TYPE;

  @ExposeProp()
  @IsOptional()
  agreementTerm1CheckedAt?: Date;

  @ExposeProp()
  @IsOptional()
  jointIntentionDisclosureCheckedAt?: Date;

  @ExposeProp()
  @IsOptional()
  creditCheckAuthorizedAt?: Date;
}
