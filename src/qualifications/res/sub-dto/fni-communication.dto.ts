import { ApiProperty } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { REQUEST_CATEGORY, REQUEST_TYPE } from '../../constants';
import { FNI_Communication } from '../../schemas/fni-communication.schema';

export class FniCommunicationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  qualificationCreditId: string;

  @ApiProperty()
  sentOn: Date;

  @ApiProperty()
  receivedOn: Date;

  @ApiProperty()
  vendorRefId: string;

  @ApiProperty()
  requestCategory: REQUEST_CATEGORY;

  @ApiProperty()
  requestType: REQUEST_TYPE;

  @ApiProperty()
  responseStatus: string;

  @ApiProperty()
  responseCode: string;

  @ApiProperty()
  rawDataFromFni: string;

  @ApiProperty()
  errorMessageSentToFni: string[];

  constructor(props: LeanDocument<FNI_Communication>) {
    this.id = props._id;
    this.qualificationCreditId = props.qualification_credit_id;
    this.sentOn = props.sent_on;
    this.receivedOn = props.received_on;
    this.vendorRefId = props.vendor_ref_id;
    this.requestCategory = props.request_category;
    this.requestType = props.request_type;
    this.responseStatus = props.response_status;
    this.responseCode = props.response_code;
    this.rawDataFromFni = props.raw_data_from_fni;
    this.errorMessageSentToFni = props.error_message_sent_to_fni;
  }
}
