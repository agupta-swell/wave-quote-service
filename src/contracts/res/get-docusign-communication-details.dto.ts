import { ServiceResponse } from 'src/app/common';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

class DocusignAccountDetail {
  @ExposeProp()
  accountName: string;

  @ExposeProp()
  accountReferenceId: string;
}

class DocusignCommunicationDetailResDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  dateTime: string;

  @ExposeProp()
  contractId: string;

  // Should be envelopeId
  @ExposeProp()
  envelopId: string;

  @ExposeProp({ type: DocusignAccountDetail })
  docusignAccountDetail: DocusignAccountDetail;

  @ExposeProp()
  requestType: string;

  @ExposeProp()
  payloadFromDocusign: string;

  @ExposeProp()
  payloadToDocusign: string;
}

export class GetDocusignCommunicationDetailsDto {
  @ExposeProp({ type: DocusignCommunicationDetailResDto, isArray: true })
  docusignCommunicationDetails: DocusignCommunicationDetailResDto[];
}

export class GetDocusignCommunicationDetailsRes implements ServiceResponse<GetDocusignCommunicationDetailsDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetDocusignCommunicationDetailsDto })
  data: GetDocusignCommunicationDetailsDto;
}
