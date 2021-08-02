import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse, Pagination } from 'src/app/common';
import { RebateProgram } from '../rebate-programs.schema';

export class RebateProgramDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rebateProgramName: string;

  constructor(props: RebateProgram) {
    this.id = props._id;
    this.rebateProgramName = props.name;
  }
}

class RebateProgramPaginationRes implements Pagination<RebateProgramDto> {
  @ApiProperty({
    type: RebateProgramDto,
    isArray: true,
  })
  data: RebateProgramDto[];

  @ApiProperty()
  total: number;
}

export class RebateProgramListRes implements ServiceResponse<RebateProgramPaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: RebateProgramPaginationRes })
  data: RebateProgramPaginationRes;
}


export class RebateProgramRes implements ServiceResponse<RebateProgramDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: RebateProgramDto })
  data: RebateProgramDto;
}
