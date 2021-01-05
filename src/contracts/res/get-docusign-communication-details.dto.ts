import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { DocusignCommunication } from 'src/docusign-communications/docusign-communication.schema';
import { toCamelCase } from 'src/utils/transformProperties';
import { Contract } from '../contract.schema';
import { ContractResDto } from './sub-dto';

class DocusignAccountDetail {
  @ApiProperty()
  accountName: string;

  @ApiProperty()
  accountReferenceId: string;
}

class DocusignCommunicationDetailResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dateTime: string;

  @ApiProperty()
  contractId: string;

  @ApiProperty()
  envelopeId: string;

  @ApiProperty({ type: DocusignAccountDetail })
  docusignAccountDetail: DocusignAccountDetail;

  @ApiProperty()
  requestType: string;

  @ApiProperty()
  payloadFromDocusign: string;

  @ApiProperty()
  payloadToDocusign: string;
}

export class GetDocusignCommunicationDetailsDto {
  @ApiProperty({ type: DocusignCommunicationDetailResDto, isArray: true })
  docusignCommunicationDetails: DocusignCommunicationDetailResDto[];

  constructor(props: DocusignCommunication[]) {
    this.docusignCommunicationDetails = props.map(item => this.transformData(item));
  }

  transformData(docusignCommunication: DocusignCommunication): DocusignCommunicationDetailResDto {
    return {
      ...toCamelCase(docusignCommunication),
      docusignAccountDetail: toCamelCase(docusignCommunication.docusign_account_detail),
    };
  }
}

export class GetDocusignCommunicationDetailsRes implements ServiceResponse<GetDocusignCommunicationDetailsDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetDocusignCommunicationDetailsDto })
  data: GetDocusignCommunicationDetailsDto;
}
