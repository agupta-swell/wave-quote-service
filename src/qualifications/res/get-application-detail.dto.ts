import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { ServiceResponse } from '../../app/common';

class ApplicantDataDto {

  @ExposeProp()
  email: string;

  // convert (333) 333-3333 -> 3333333333
  @ExposeAndMap({}, ({ obj }) => obj.cellPhone?.match(/\d+/g).join(""))
  phoneNumber: string;
}

export class InstallationAddressDto {
  @ExposeProp()
  addressLine1: string;

  @ExposeProp()
  addressLine2: string;

  @ExposeProp()
  city: string;

  @ExposeProp()
  state: string;

  @ExposeProp()
  zipcode: string;
}

export class GetApplicationDetailDto {
  @ExposeProp()
  qualificationCreditId: string;

  @ExposeProp()
  opportunityId: string;

  @ExposeProp()
  responseStatus: boolean;

  @ExposeProp()
  processStatus: boolean;

  @ExposeAndMap({ type: ApplicantDataDto }, ({ obj }) => obj.contact)
  primaryApplicantData: ApplicantDataDto;

  @ExposeProp()
  newJWTToken: string;

  @ExposeProp()
  hasCoApplicant: boolean ;

  @ExposeProp()
  contactId: string ;

  @ExposeProp({type: InstallationAddressDto})
  installationAddress: InstallationAddressDto;
}

export class GetApplicationDetailRes implements ServiceResponse<GetApplicationDetailDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetApplicationDetailDto })
  data: GetApplicationDetailDto;
}
