import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { ScenarioDataDto, ServiceResponseStatusDataDto } from './sub-dto';

export class GetSavingDto {
  @ApiProperty({ type: ServiceResponseStatusDataDto })
  serviceResponseStatus?: ServiceResponseStatusDataDto;

  @ApiProperty({ type: ScenarioDataDto, isArray: true })
  scenarioDataDetail?: ScenarioDataDto[];

  constructor(props: GetSavingDto) {}
}

export class GetSavingRes implements ServiceResponse<GetSavingDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetSavingDto })
  data: GetSavingDto;
}
