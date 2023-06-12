import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, ValidateNested, IsEnum, IsOptional } from 'class-validator';
import { ContactReqDto } from 'src/contacts/req/contact.req';
import { CONSENT_STATUS } from '../constants';

class ApplicantConsentDetailDto {
  @ApiProperty()
  @IsBoolean()
  option: boolean;

  @ApiProperty()
  @IsEnum(CONSENT_STATUS)
  type: string;

  @ApiProperty()
  @IsOptional()
  coApplicantContact?: ContactReqDto;
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
