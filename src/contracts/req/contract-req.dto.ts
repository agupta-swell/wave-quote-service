import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CONTRACT_TYPE } from '../constants';
import { SignerDetailDto } from './sub-dto/signer-detail.dto';

export class ContractReqDto {
  @ApiPropertyOptional()
  @IsOptional()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  opportunityId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  associatedQuoteId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
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
  primaryContractId: string;

  @ApiPropertyOptional()
  changeOrderDescription: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  contractType: CONTRACT_TYPE;
}
