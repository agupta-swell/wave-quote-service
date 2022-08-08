import { Pagination } from 'src/app/common';
import { ServiceResponse } from 'src/app/common/service-response';
import { ExistingSystemResDto } from 'src/existing-systems/res';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { SystemProductionDto } from 'src/system-production/res';
import { PinballSimulatorDto } from 'src/utilities/res/pinball-simulator.dto';
import { CapacityProductionDataDto, RoofTopDataDto, sunroofDriftCorrectionResDto } from './sub-dto';

export class SystemDesignDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  opportunityId: string;

  @ExposeProp()
  designMode: string;

  @ExposeProp()
  name: string;

  @ExposeProp({ type: RoofTopDataDto })
  roofTopDesignData: RoofTopDataDto;

  @ExposeProp({ type: CapacityProductionDataDto })
  capacityProductionDesignData: CapacityProductionDataDto;

  @ExposeProp({ type: SystemProductionDto })
  systemProductionData: SystemProductionDto;

  @ExposeProp()
  latitude: number;

  @ExposeProp()
  longitude: number;

  @ExposeProp()
  thumbnail: string;

  @ExposeProp()
  isSelected: boolean;

  @ExposeProp()
  isRetrofit: boolean;

  @ExposeProp()
  isSolar: boolean;

  @ExposeProp({ default: true, skipTransform: true })
  editable: boolean;

  @ExposeProp()
  editableMessage?: string;

  @ExposeProp()
  sunroofDriftCorrection: sunroofDriftCorrectionResDto;

  @ExposeProp({ type: ExistingSystemResDto })
  existingSystem: ExistingSystemResDto;

  @ExposeProp()
  pinballSimulatorId: string;

  @ExposeProp({ type: PinballSimulatorDto })
  pinballSimulator: PinballSimulatorDto;
}

class SystemDesignPaginationRes implements Pagination<SystemDesignDto> {
  @ExposeProp({
    type: SystemDesignDto,
    isArray: true,
  })
  data: SystemDesignDto[];

  @ExposeProp()
  total: number;
}

export class SystemDesignListRes implements ServiceResponse<SystemDesignPaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: SystemDesignPaginationRes })
  data: SystemDesignPaginationRes;
}

export class SystemDesignRes implements ServiceResponse<SystemDesignDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: SystemDesignDto })
  data: SystemDesignDto;
}
