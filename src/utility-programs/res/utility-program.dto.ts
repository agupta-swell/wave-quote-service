import { ApiProperty } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';

export class UtilityProgramDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  constructor(props: any) {
    this.id = props._id;
    this.name = props.name;
  }
}

class UtilityProgramPaginationRes implements Pagination<UtilityProgramDto> {
  @ApiProperty({
    type: UtilityProgramDto,
    isArray: true,
  })
  data: UtilityProgramDto[];

  @ApiProperty()
  total: number;
}

export class UtilityProgramListRes implements ServiceResponse<UtilityProgramPaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: UtilityProgramPaginationRes })
  data: UtilityProgramPaginationRes;
}

export class UtilityProgramRes implements ServiceResponse<UtilityProgramDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: UtilityProgramDto })
  data: UtilityProgramDto;
}
