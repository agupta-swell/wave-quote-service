import { ApiProperty } from '@nestjs/swagger';
import { CONTRACT_TYPE } from 'src/contracts/constants';
import { PROCESS_STATUS } from 'src/qualifications/constants';
import { SignerDetailResDto } from './signer-detail.dto';

export class ContractResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  opportunityId: string;

  @ApiProperty({ enum: CONTRACT_TYPE })
  contractType: CONTRACT_TYPE;

  @ApiProperty()
  name: string;

  @ApiProperty()
  associatedQuoteId: string;

  @ApiProperty()
  contractTemplateId: string;

  @ApiProperty({ type: SignerDetailResDto, isArray: true })
  signerDetails: SignerDetailResDto[];

  @ApiProperty()
  templateDetail: any;

  @ApiProperty()
  contractingSystem: string;

  @ApiProperty()
  primaryContractId: string;

  @ApiProperty({ enum: PROCESS_STATUS })
  contractStatus: PROCESS_STATUS;

  @ApiProperty()
  chnageOrderDescription: string;

  @ApiProperty()
  completionDate: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
