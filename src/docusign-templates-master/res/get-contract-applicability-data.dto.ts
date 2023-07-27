import { LeanDocument } from 'mongoose';
import { ServiceResponse } from 'src/app/common';
import { FinancialProductDto } from 'src/financial-products/res/financial-product.dto';
import { FinancierDto } from 'src/financiers/res/financier.dto';
import { FundingSource } from 'src/funding-sources/funding-source.schema';
import { FundingSourceDto } from 'src/funding-sources/res/funding-source.dto';
import { ExposeProp } from 'src/shared/decorators';
import { UtilitiesMasterResDto } from 'src/utilities-master/res/utilities-master.dto';
import { UtilitiesMaster } from 'src/utilities-master/utilities-master.schema';
import { UtilityProgramMasterDto } from 'src/utility-programs-master/res/utility-program-master.dto';
import { UtilityProgramMaster } from 'src/utility-programs-master/utility-program-master.schema';

export interface IGetContractApplicabilityDataDto {
  applicableFundingSources: LeanDocument<FundingSource>[];
  applicableUtilityPrograms: LeanDocument<UtilityProgramMaster>[];
  applicableUtilities: LeanDocument<UtilitiesMaster>[];
}

export class GetContractApplicabilityDataDto {
  @ExposeProp({ type: FundingSourceDto, isArray: true })
  applicableFundingSources: FundingSourceDto[];

  @ExposeProp({ type: UtilityProgramMasterDto, isArray: true })
  applicableUtilityPrograms: UtilityProgramMasterDto[];

  @ExposeProp({ type: UtilitiesMasterResDto, isArray: true })
  applicableUtilities: UtilitiesMasterResDto[];

  @ExposeProp({ type: FinancierDto, isArray: true })
  applicableFinanciers: FinancierDto[];

  @ExposeProp({ type: FinancialProductDto, isArray: true })
  applicableFinancialProductTypes: FinancialProductDto[];
}

export class GetContractApplicabilityDataRes implements ServiceResponse<GetContractApplicabilityDataDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetContractApplicabilityDataDto })
  data: GetContractApplicabilityDataDto;
}
