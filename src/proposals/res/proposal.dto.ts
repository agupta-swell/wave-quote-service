import { ApiProperty } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { QuoteDto } from '../../quotes/res/quote.dto';
import { SystemDesignDto } from '../../system-designs/res/system-design.dto';
import { toCamelCase } from '../../utils/transformProperties';
import { Proposal } from '../proposal.schema';

class RecipientDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  componentName: string;
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
  templateId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  pdfFileUrl: string;

  constructor(props: Proposal) {
    this.id = props._id;
    if (props.detailed_proposal) {
      this.isSelected = props.detailed_proposal.is_selected || false;
      this.quoteData = new QuoteDto(props.detailed_proposal.quote_data as any);
      this.systemDesignData = new SystemDesignDto(props.detailed_proposal.system_design_data as any);
      this.proposalName = props.detailed_proposal.proposal_name;
      this.proposalCreationDate = props.detailed_proposal.proposal_creation_date;
      this.proposalSentDate = props.detailed_proposal.proposal_sent_date;
      this.recipients = props.detailed_proposal.recipients.map(item => toCamelCase(item));
      this.proposalValidityPeriod = props.detailed_proposal.proposal_validity_period;
      this.templateId = props.detailed_proposal.template_id;
      this.status = props.detailed_proposal.status;
      this.pdfFileUrl = props.detailed_proposal.pdf_file_url;
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
