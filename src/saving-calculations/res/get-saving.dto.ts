import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';
import { ScenarioDataDto, ServiceResponseStatusDataDto } from './sub-dto';

export class GetSavingDto {
  @ExposeProp({ type: ServiceResponseStatusDataDto })
  serviceResponseStatus?: ServiceResponseStatusDataDto;

  @ExposeProp({ type: ScenarioDataDto, isArray: true })
  scenarioDataDetail?: ScenarioDataDto[];
}

export class GetSavingRes implements ServiceResponse<GetSavingDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetSavingDto })
  data: GetSavingDto;
}
