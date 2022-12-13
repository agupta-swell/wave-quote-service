import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CONTRACT_TYPE } from '../constants';
import { SignerDetailDto } from './sub-dto/signer-detail.dto';

export class ContractReqDto {
  @ApiPropertyOptional()
  @IsOptional()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  opportunityId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  gsOpportunityId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  associatedQuoteId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  @ValidateIf(obj => obj.contractType === CONTRACT_TYPE.NO_COST_CHANGE_ORDER)
  systemDesignId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @ValidateIf(obj => !(obj.gsOpportunityId && obj.customGSPTemplateIds?.length))
  contractTemplateId: string;

  @ApiProperty({ type: SignerDetailDto, isArray: true })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SignerDetailDto)
  signerDetails: SignerDetailDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @ValidateIf(
    obj => obj.contractType === CONTRACT_TYPE.CHANGE_ORDER || obj.contractType === CONTRACT_TYPE.NO_COST_CHANGE_ORDER,
  )
  primaryContractId: string;

  @ApiPropertyOptional()
  changeOrderDescription: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(CONTRACT_TYPE)
  contractType: CONTRACT_TYPE;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  customGSPTemplateIds: string[];

  @ApiProperty()
  @IsOptional()
  customGSPBeginPageNumberingTemplateId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  primaryOwnerContactId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  utilityProgramId: string;
}
