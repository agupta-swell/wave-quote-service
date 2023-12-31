import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';
import { FINANCE_TYPE_EXISTING_SOLAR, INVERTER_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';

export class GetRelatedInformationDto {
  @ExposeProp()
  address: string;

  @ExposeProp()
  city: string;

  @ExposeProp()
  firstName: string;

  @ExposeProp()
  lastName: string;

  @ExposeProp()
  email: string;

  @ExposeProp()
  opportunityId: string;

  @ExposeProp()
  state: string;

  @ExposeProp()
  latitude: string;

  @ExposeProp()
  longitude: string;

  @ExposeProp()
  utilityProgramId: string;

  @ExposeProp()
  rebateProgramId: string;

  @ExposeProp()
  zipCode: string;

  @ExposeProp()
  partnerId: string;

  @ExposeProp()
  opportunityName: string;

  @ExposeProp()
  existingPV: boolean;

  @ExposeProp()
  hasGrantedHomeBatterySystemRights: boolean;

  @ExposeProp()
  hasHadOtherDemandResponseProvider: boolean;

  @ExposeProp()
  interconnectedWithExistingSystem: boolean;

  @ExposeProp()
  originalInstaller: string;

  @ExposeProp()
  existingPVSize: number;

  @ExposeProp()
  yearSystemInstalled: number;

  @ExposeProp()
  inverter: INVERTER_TYPE_EXISTING_SOLAR;

  @ExposeProp()
  financeType: FINANCE_TYPE_EXISTING_SOLAR;

  @ExposeProp()
  inverterManufacturer: string;

  @ExposeProp()
  inverterModel: string;

  @ExposeProp()
  tpoFundingSource: string;

  @ExposeProp()
  existingPVTilt: number;

  @ExposeProp()
  existingPVAzimuth: number;

  @ExposeProp()
  assignedMember: string;

  @ExposeProp()
  applicantName: string;

  @ExposeProp()
  coapplicantName: string;

  @ExposeProp()
  applicantCreditApproved: boolean;

  @ExposeProp()
  coapplicantCreditApproved: boolean;

  @ExposeProp()
  onTitleName: string;

  @ExposeProp()
  onTitleAddress: string;

  @ExposeProp()
  alternateTitleDocumentationSubmitted: boolean;

  @ExposeProp()
  alternateTitleDocumentationSubmitDate: Date;

  @ExposeProp()
  alternateTitleDocumentationName: string;

  @ExposeProp()
  alternateTitleDocumentationAddress: string;

  @ExposeProp()
  applicantNameMatchesTitle: boolean;

  @ExposeProp()
  coapplicantNameMatchesTitle: boolean;

  @ExposeProp()
  propertyId: string;
}

export class GetRelatedInformationRes implements ServiceResponse<GetRelatedInformationDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetRelatedInformationDto })
  data: GetRelatedInformationDto;
}
