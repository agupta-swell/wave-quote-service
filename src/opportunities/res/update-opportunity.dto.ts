import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { Opportunity } from '../opportunity.schema';
import { GetRelatedInformationDto } from './get-related-information.dto';

export class UpdateOpportunityDto {
  @ApiProperty()
  contactId: string;

  @ApiProperty()
  utilityId: string;

  @ApiProperty()
  utilityProgramId: string;

  @ApiProperty()
  fundingSourceId: string;

  @ApiProperty()
  contractorCompanyName: string;

  @ApiProperty()
  contractorAddress1: string;

  @ApiProperty()
  contractorAddress2: string;

  @ApiProperty()
  contractorLicense: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  isPrimeContractor: boolean;

  @ApiProperty()
  contractorEmail: string;

  @ApiProperty()
  contractorSigner: string;

  @ApiProperty()
  recordOwner: string;

  @ApiProperty()
  accountId: string;

  constructor(props: Opportunity) {
    this.contactId = props.contactId;
    this.utilityId = props.utilityId;
    this.utilityProgramId = props.utilityProgramId;
    this.fundingSourceId = props.fundingSourceId;
    this.contractorCompanyName = props.contractorCompanyName;
    this.contractorAddress1 = props.contractorAddress1;
    this.contractorAddress2 = props.contractorAddress2;
    this.contractorLicense = props.contractorLicense;
    this.amount = props.amount;
    this.isPrimeContractor = props.isPrimeContractor;
    this.contractorEmail = props.contractorEmail;
    this.contractorSigner = props.contractorSigner;
    this.recordOwner = props.recordOwner;
    this.accountId = props.accountId;
  }
}

export class UpdateOpportunityRes implements ServiceResponse<GetRelatedInformationDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetRelatedInformationDto })
  data: GetRelatedInformationDto;
}
