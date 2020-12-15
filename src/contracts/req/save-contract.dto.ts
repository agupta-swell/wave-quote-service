import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CONTRACT_TYPE, PROCESS_STATUS } from '../constants';

class ContractReqDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  opportunityId: string;

  @ApiProperty({ enum: CONTRACT_TYPE })
  contractType: CONTRACT_TYPE;

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

  @ApiProperty()
  templateDetail;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  contractingSystem: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  primaryContractId: string;

  @ApiProperty({ enum: PROCESS_STATUS })
  contractStatus: PROCESS_STATUS;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsString()
  // chnageOrderDescription: string;

  // @ApiProperty()
  // completionDate: string;
}

export class SaveContractReqDto {
  @ApiProperty()
  mode: string;

  @ApiProperty({ type: ContractReqDto })
  contractDetail: ContractReqDto;
}
