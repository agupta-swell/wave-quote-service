import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, ValidateNested, IsEnum } from 'class-validator';
import { CONSENT_STATUS } from '../constants';

class ApplicantConsentDetailDto {
  @ApiProperty()
  @IsBoolean()
  option: boolean;

  @ApiProperty()
  @IsEnum(CONSENT_STATUS)
  type: string;
}

export class SetApplicantConsentReqDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  userFullName: string;

  @ApiProperty({ type: ApplicantConsentDetailDto })
  @ValidateNested()
  @Type(() => ApplicantConsentDetailDto)
  applicantConsent: ApplicantConsentDetailDto;
}
