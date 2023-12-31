import { Exclude, Transform } from 'class-transformer';
import { Pagination } from 'src/app/common';
import { ServiceResponse } from 'src/app/common/service-response';
import { ExistingSystemResDto } from 'src/existing-systems/res';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { SystemProductionDto } from 'src/system-productions/res';
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
  @Transform(({ value, obj }) => {
    if (value?.roofTopImage) {
      value.roofTopImage.imageURL = obj.imageURL;
    }
    return value;
  })
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

  @ExposeProp()
  isArchived?: boolean;

  @ExposeProp()
  isSentProposalsExisted: boolean;

  @ExposeProp()
  isContractsExisted: boolean;
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

export class CalculateSystemActualProductionResDto {
  @ExposeProp()
  scaled8760ProductionByArray?: number[][];

  @ExposeProp()
  appliedSoilingDerate8760ProductionByArray?: number[][];

  @ExposeProp()
  appliedSnowDerate8760ProductionByArray?: number[][];

  @ExposeProp()
  appliedInverterClipping8760ProductionByArray?: number[][];

  @ExposeProp()
  appliedInverterEfficiency8760ProductionByArray?: number[][];

  @ExposeProp()
  systemActualProduction8760: number[];
}
