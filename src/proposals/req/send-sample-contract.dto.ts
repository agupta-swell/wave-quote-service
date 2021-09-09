import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SIGN_STATUS } from 'src/contracts/constants';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class TemplateDetailDto {
  @ApiProperty()
  @IsMongoId()
  id: string;

  @ApiProperty()
  @IsMongoId()
  compositeTemplateId: string;
}

export class SignerDetailDto {
  @ApiProperty()
  @IsMongoId()
  roleId: string;

  @ApiProperty()
  @IsString()
  role: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @ValidateIf((_, v) => v)
  @IsEmail()
  email: string;

  @ApiProperty({ enum: SIGN_STATUS })
  // @IsEnum(SIGN_STATUS)
  signStatus: SIGN_STATUS;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  sentOn: Date;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  signedOn: Date;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  phoneNumber: string;
}

export class ProposalSendSampleContractDto {
  @ApiProperty({ type: [TemplateDetailDto] })
  @Type(() => TemplateDetailDto)
  @ValidateNested({ each: true })
  templateDetails: TemplateDetailDto[];

  @ApiProperty({ name: 'signerDetails', type: [SignerDetailDto] })
  @Type(() => SignerDetailDto)
  @ValidateNested({ each: true })
  signerDetails: SignerDetailDto[];
}
