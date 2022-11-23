import { Pagination, ServiceResponse } from 'src/app/common';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class UtilityProgramMasterDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  rebateAmount: number;

  @ExposeProp()
  gsaDisplayName: string;

  @ExposeProp()
  programManagerId: string;

  @ExposeProp()
  utilityProgramName: string;

  @ExposeProp()
  isActive: boolean;

  @ExposeProp()
  sendToGridAmp: boolean;

  @ExposeProp()
  automaticallyApproveControl: boolean;

  @ExposeProp()
  endDate: string;
}

class UtilityProgramMasterPaginationRes implements Pagination<UtilityProgramMasterDto> {
  @ExposeProp({
    type: UtilityProgramMasterDto,
    isArray: true,
  })
  data: UtilityProgramMasterDto[];

  @ExposeProp()
  total: number;
}

export class UtilityProgramMasterListRes implements ServiceResponse<UtilityProgramMasterPaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: UtilityProgramMasterPaginationRes })
  data: UtilityProgramMasterPaginationRes;
}

export class UtilityProgramMasterRes implements ServiceResponse<UtilityProgramMasterDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: UtilityProgramMasterDto })
  data: UtilityProgramMasterDto;
}
