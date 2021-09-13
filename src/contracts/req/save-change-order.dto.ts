import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';
import { REQUEST_MODE } from '../constants';
import { ContractReqDto } from './contract-req.dto';

export class SaveChangeOrderReqDto {
  @ApiProperty({ enum: REQUEST_MODE })
  @IsEnum(REQUEST_MODE)
  mode: REQUEST_MODE;

  @ApiProperty({ type: ContractReqDto })
  @ValidateNested()
  @Type(() => ContractReqDto)
  contractDetail: ContractReqDto;
}
