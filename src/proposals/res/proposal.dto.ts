import { Pagination, ServiceResponse } from 'src/app/common';
import { ProposalTemplateDto } from 'src/proposal-templates/res/proposal-template.dto';
import { QuoteDto } from 'src/quotes/res/quote.dto';
import { ExposeAndMap, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { SystemDesignDto } from 'src/system-designs/res/system-design.dto';

class RecipientDto {
  @ExposeProp()
  email: string;

  @ExposeProp()
  firstName: string;

  @ExposeProp()
  lastName: string;

  @ExposeProp()
  componentName: string;
}

class UserInformationDto {
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
  state: string;

  @ExposeProp()
  zipCode: string;

  @ExposeProp()
  phoneNumber: string;
}

export class ProposalDto {
  @ExposeMongoId()
  id: string;

  @ExposeAndMap({}, ({ obj }) => obj.detailedProposal?.isSelected || false)
  isSelected: boolean;

  @ExposeAndMap({ type: QuoteDto, root: 'detailedProposal' })
  quoteData: QuoteDto;

  @ExposeAndMap({ type: SystemDesignDto, root: 'detailedProposal' })
  systemDesignData: SystemDesignDto;

  @ExposeAndMap({ root: 'detailedProposal' })
  proposalName: string;

  @ExposeAndMap({ root: 'detailedProposal' })
  proposalCreationDate: Date;

  @ExposeAndMap({ root: 'detailedProposal' })
  proposalSentDate: Date;

  @ExposeAndMap({ type: RecipientDto, root: 'detailedProposal' })
  recipients: RecipientDto[];

  @ExposeAndMap({ root: 'detailedProposal' })
  proposalValidityPeriod: number;

  @ExposeAndMap({ root: 'detailedProposal' })
  status: string;

  @ExposeAndMap({ root: 'detailedProposal' })
  pdfFileUrl: string;

  @ExposeAndMap({ root: 'detailedProposal' })
  htmlFileUrl: string;

  @ExposeAndMap({ root: 'detailedProposal' })
  sampleContractUrl?: string;

  @ExposeAndMap({ root: 'detailedProposal', type: ProposalTemplateDto })
  proposalTemplateSnapshot?: ProposalTemplateDto;

  @ExposeProp()
  quoteId: string;

  @ExposeProp()
  systemDesignId: string;

  @ExposeAndMap({ root: 'detailedProposal' })
  templateId: string;

  @ExposeProp({ type: ProposalTemplateDto })
  template: ProposalTemplateDto;

  @ExposeProp({ type: UserInformationDto })
  agent: UserInformationDto;

  @ExposeProp({ type: UserInformationDto })
  customer: UserInformationDto;

  @ExposeProp()
  proposalView: string;

  @ExposeProp()
  proposalPeriod: string;

  @ExposeProp()
  proposalMonthIndex: number;

  @ExposeProp()
  isArchived: boolean;

  @ExposeProp()
  isSent: boolean;
}

class ProposalPaginationRes implements Pagination<ProposalDto> {
  @ExposeProp({
    type: ProposalDto,
    isArray: true,
  })
  data: ProposalDto[];

  @ExposeProp()
  total: number;
}

export class ProposalListRes implements ServiceResponse<ProposalPaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ProposalPaginationRes })
  data: ProposalPaginationRes;
}

export class ProposalRes implements ServiceResponse<ProposalDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ProposalDto })
  data: ProposalDto;
}
