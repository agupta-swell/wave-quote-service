import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { ServiceResponse } from '../../app/common';

class ApplicantDataDto {

  @ExposeProp()
  email: string;

  // convert (333) 333-3333 -> 3333333333
  @ExposeAndMap({}, ({ obj }) => obj.cellPhone?.match(/\d+/g).join(""))
  phoneNumber: string;

  @ExposeAndMap({}, ({ obj }) => obj.address1)
  addressLine1: string;

  @ExposeAndMap({}, ({ obj }) => obj.address2)
  addressLine2: string;

  @ExposeProp()
  city: string;

  @ExposeProp()
  state: string;

  @ExposeAndMap({}, ({ obj }) => obj.zip)
  zipcode: number;
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

  @ExposeProp({ type: ApplicantDataDto }) // TODO: remove later
  coApplicantData: ApplicantDataDto;

  @ExposeProp()
  newJWTToken: string;

  @ExposeProp()
  hasCoApplicant: boolean ;

  @ExposeProp()
  contactId: string ;
}

export class GetApplicationDetailRes implements ServiceResponse<GetApplicationDetailDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetApplicationDetailDto })
  data: GetApplicationDetailDto;
}
