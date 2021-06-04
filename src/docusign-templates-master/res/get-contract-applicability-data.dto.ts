import { LeanDocument } from 'mongoose';
import { ServiceResponse } from 'src/app/common';
import { FundingSource } from 'src/funding-sources/funding-source.schema';
import { FundingSourceDto } from 'src/funding-sources/res/funding-source.dto';
import { ExposeProp } from 'src/shared/decorators'
import { UtilityProgramMasterDto } from 'src/utility-programs-master/res/utility-program-master.dto';
import { UtilityProgramMaster } from 'src/utility-programs-master/utility-program-master.schema';
import { UtilityMaster } from '../schemas/utility-master.schema';
import { UtilityMasterResDto } from './sub-dto';

export interface IGetContractApplicabilityDataDto {
  applicableFundingSources: LeanDocument<FundingSource>[];
  applicableUtilityPrograms: LeanDocument<UtilityProgramMaster>[];
  applicableUtilities: LeanDocument<UtilityMaster>[];
}

export class GetContractApplicabilityDataDto {
  @ExposeProp({ type: FundingSourceDto, isArray: true })
  applicableFundingSources: FundingSourceDto[];

  @ExposeProp({ type: UtilityProgramMasterDto, isArray: true })
  applicableUtilityPrograms: UtilityProgramMasterDto[];

  @ExposeProp({ type: UtilityMasterResDto, isArray: true })
  applicableUtilities: UtilityMasterResDto[];
}

export class GetContractApplicabilityDataRes implements ServiceResponse<GetContractApplicabilityDataDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetContractApplicabilityDataDto })
  data: GetContractApplicabilityDataDto;
}
