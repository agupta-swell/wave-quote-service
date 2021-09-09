import { ApiProperty } from '@nestjs/swagger';
import { REQUEST_MODE } from '../constants';
import { ContractReqDto } from './contract-req.dto';

export class SaveChangeOrderReqDto {
  @ApiProperty({ enum: REQUEST_MODE })
  mode: REQUEST_MODE;

  @ApiProperty({ type: ContractReqDto })
  contractDetail: ContractReqDto;
}
