import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { FundingSource } from 'src/funding-sources/funding-source.schema';
import { FundingSourceDto } from 'src/funding-sources/res/funding-source.dto';
import { UtilityProgramMasterDto } from 'src/utility-programs-master/res/utility-program-master.dto';
import { UtilityProgramMaster } from 'src/utility-programs-master/utility-program-master.schema';
import { toCamelCase } from './../../utils/transformProperties';
import { UtilityMaster } from './../schemas/utility-master.schema';
import { UtilityMasterResDto } from './sub-dto';

export interface IGetContractApplicabilityDataDto {
  applicableFundingSources: FundingSource[];
  applicableUtilityPrograms: UtilityProgramMaster[];
  applicableUtilities: UtilityMaster[];
}

export class GetContractApplicabilityDataDto {
  @ApiProperty({ type: FundingSourceDto, isArray: true })
  applicableFundingSources: FundingSourceDto[];

  @ApiProperty({ type: UtilityProgramMasterDto, isArray: true })
  applicableUtilityPrograms: UtilityProgramMasterDto[];

  @ApiProperty({ type: UtilityMasterResDto, isArray: true })
  applicableUtilities: UtilityMasterResDto[];

  constructor(props: IGetContractApplicabilityDataDto) {
    this.applicableFundingSources = props.applicableFundingSources.map(item => toCamelCase(item));
    this.applicableUtilityPrograms = props.applicableUtilityPrograms.map(item => toCamelCase(item));
    this.applicableUtilities = props.applicableUtilities.map(item => toCamelCase(item));
  }
}

export class GetContractApplicabilityDataRes implements ServiceResponse<GetContractApplicabilityDataDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetContractApplicabilityDataDto })
  data: GetContractApplicabilityDataDto;
}
