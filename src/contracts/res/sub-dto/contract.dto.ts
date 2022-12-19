import { CONTRACT_TYPE } from 'src/contracts/constants';
import {
  DocusignCompositeTemplateMasterDataResDto,
  TemplateMasterDataResDto,
} from 'src/docusign-templates-master/res/sub-dto';
import { PROCESS_STATUS } from 'src/qualifications/constants';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { SignerDetailResDto } from './signer-detail.dto';

class TemplateDetailResDto {
  @ExposeProp({ type: TemplateMasterDataResDto, isArray: true })
  templateDetails: TemplateMasterDataResDto[];

  @ExposeProp({ type: DocusignCompositeTemplateMasterDataResDto })
  compositeTemplateData: DocusignCompositeTemplateMasterDataResDto;
}

export class ContractResDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  opportunityId: string;

  @ExposeProp()
  gsOpportunityId: string;

  @ExposeProp({ enum: CONTRACT_TYPE })
  contractType: CONTRACT_TYPE;

  @ExposeProp()
  name: string;

  @ExposeProp()
  associatedQuoteId: string;

  @ExposeProp()
  contractTemplateId: string;

  @ExposeProp({ type: SignerDetailResDto, isArray: true })
  signerDetails: SignerDetailResDto[];

  @ExposeProp({ type: TemplateDetailResDto })
  contractTemplateDetail: TemplateDetailResDto;

  @ExposeProp()
  contractingSystem: string;

  @ExposeProp()
  contractingSystemReferenceId: string;

  @ExposeProp()
  primaryContractId: string;

  @ExposeProp({ enum: PROCESS_STATUS })
  contractStatus: PROCESS_STATUS;

  @ExposeProp()
  changeOrderDescription: string;

  @ExposeProp()
  projectCompletionDate: Date;

  @ExposeProp()
  createdAt: Date;

  @ExposeProp()
  updatedAt: Date;

  @ExposeProp()
  systemDesignId: string;

  @ExposeProp()
  primaryOwnerContactId: string;

  @ExposeProp()
  utilityProgramId: string;
}

export class ContractResDetailDto {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ContractResDto })
  data: ContractResDto;
}
