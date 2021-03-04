import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { REQUEST_MODE } from '../constants';
import { SignerDetailDto } from './sub-dto/signer-detail.dto';

class ContractReqDto {
  @ApiPropertyOptional()
  @IsOptional()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  opportunityId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
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
  chnageOrderDescription: string;
}

export class SaveContractReqDto {
  @ApiProperty({ enum: REQUEST_MODE })
  mode: REQUEST_MODE;

  @ApiProperty({ type: ContractReqDto })
  contractDetail: ContractReqDto;
}
