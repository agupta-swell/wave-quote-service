import { ApiProperty } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { UtilityProgramMaster } from '../utility-program-master.schema';

export class UtilityProgramMasterDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rebateAmount: number;

  @ApiProperty()
  utilityProgramName: string;

  constructor(props: UtilityProgramMaster) {
    this.id = props._id;
    this.rebateAmount = props.rebate_amount;
    this.utilityProgramName = props.utility_program_name;
  }
}

class UtilityProgramMasterPaginationRes implements Pagination<UtilityProgramMasterDto> {
  @ApiProperty({
    type: UtilityProgramMasterDto,
    isArray: true,
  })
  data: UtilityProgramMasterDto[];

  @ApiProperty()
  total: number;
}

export class UtilityProgramMasterListRes implements ServiceResponse<UtilityProgramMasterPaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: UtilityProgramMasterPaginationRes })
  data: UtilityProgramMasterPaginationRes;
}

export class UtilityProgramMasterRes implements ServiceResponse<UtilityProgramMasterDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: UtilityProgramMasterDto })
  data: UtilityProgramMasterDto;
}
