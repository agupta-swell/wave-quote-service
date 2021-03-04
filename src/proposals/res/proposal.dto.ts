import { ApiProperty } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { ProposalTemplateDto } from 'src/proposal-templates/res/proposal-template.dto';
import { QuoteDto } from 'src/quotes/res/quote.dto';
import { SystemDesignDto } from 'src/system-designs/res/system-design.dto';
import { toCamelCase } from 'src/utils/transformProperties';
import { Proposal } from '../proposal.schema';

class RecipientDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  componentName: string;
}

class UserInformationDto {
  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  zipCode: string;

  @ApiProperty()
  phoneNumber: string;

  constructor(props: UserInformationDto) {
    this.address = props.address;
    this.city = props.city;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.email = props.email;
    this.state = props.state;
    this.zipCode = props.zipCode;
    this.phoneNumber = props.phoneNumber;
  }
}

export class ProposalDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  isSelected: boolean;

  @ApiProperty({ type: QuoteDto })
  quoteData: QuoteDto;

  @ApiProperty({ type: SystemDesignDto })
  systemDesignData: SystemDesignDto;

  @ApiProperty()
  proposalName: string;

  @ApiProperty()
  proposalCreationDate: Date;

  @ApiProperty()
  proposalSentDate: Date;

  @ApiProperty()
  recipients: RecipientDto[];

  @ApiProperty()
  proposalValidityPeriod: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  pdfFileUrl: string;

  @ApiProperty()
  htmlFileUrl: string;

  @ApiProperty()
  quoteId: string;

  @ApiProperty()
  systemDesignId: string;

  @ApiProperty()
  templateId: string;

  @ApiProperty({ type: ProposalTemplateDto })
  template: ProposalTemplateDto;

  @ApiProperty({ type: UserInformationDto })
  agent: UserInformationDto;

  @ApiProperty({ type: UserInformationDto })
  customer: UserInformationDto;

  constructor(props: Proposal) {
    this.id = props._id;
    if (props.detailed_proposal) {
      this.isSelected = props.detailed_proposal.is_selected || false;
      this.quoteId = props.quote_id;
      this.systemDesignId = props.system_design_id;
      this.quoteData =
        props.detailed_proposal.quote_data &&
        new QuoteDto({ detailed_quote: props.detailed_proposal.quote_data } as any);
      this.systemDesignData =
        props.detailed_proposal.system_design_data &&
        new SystemDesignDto(props.detailed_proposal.system_design_data as any);
      this.proposalName = props.detailed_proposal.proposal_name;
      this.proposalCreationDate = props.detailed_proposal.proposal_creation_date;
      this.proposalSentDate = props.detailed_proposal.proposal_sent_date;
      this.recipients = props.detailed_proposal.recipients.map(item => toCamelCase(item));
      this.proposalValidityPeriod = props.detailed_proposal.proposal_validity_period;
      this.templateId = props.detailed_proposal.template_id;
      this.template = (props as any)?.template && new ProposalTemplateDto((props as any)?.template);
      this.status = props.detailed_proposal.status;
      this.pdfFileUrl = props.detailed_proposal.pdf_file_url;
      this.htmlFileUrl = props.detailed_proposal.html_file_url;
      this.agent = (props as any)?.agent && new UserInformationDto((props as any)?.agent);
      this.customer = (props as any)?.customer && new UserInformationDto((props as any)?.customer);
    }
  }
}

class ProposalPaginationRes implements Pagination<ProposalDto> {
  @ApiProperty({
    type: ProposalDto,
    isArray: true,
  })
  data: ProposalDto[];

  @ApiProperty()
  total: number;
}

export class ProposalListRes implements ServiceResponse<ProposalPaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ProposalPaginationRes })
  data: ProposalPaginationRes;
}

export class ProposalRes implements ServiceResponse<ProposalDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ProposalDto })
  data: ProposalDto;
}
