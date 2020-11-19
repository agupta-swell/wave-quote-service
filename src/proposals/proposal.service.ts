import { ValidateProposalDto } from './req/validate-proposal.dto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as Handlebars from 'handlebars';
import { identity, pickBy } from 'lodash';
import { Model } from 'mongoose';
import { createTransport } from 'nodemailer';
import { ProposalTemplateService } from 'src/proposal-templates/proposal-template.service';
import { OperationResult, Pagination } from '../app/common';
import { CurrentUserType } from '../app/securities';
import { SystemDesignService } from '../system-designs/system-design.service';
import { ApplicationException } from './../app/app.exception';
import { QuoteService } from './../quotes/quote.service';
import { PROPOSAL_STATUS } from './constants';
import { IDetailedProposalSchema, Proposal, PROPOSAL } from './proposal.schema';
import { CreateProposalDto } from './req/create-proposal.dto';
import { UpdateProposalDto } from './req/update-proposal.dto';
import { ProposalDto } from './res/proposal.dto';
import proposalTemplate from './template-html/proposal-template';

@Injectable()
export class ProposalService {
  constructor(
    @InjectModel(PROPOSAL) private proposalModel: Model<Proposal>,
    private readonly systemDesignService: SystemDesignService,
    private readonly quoteService: QuoteService,
    private readonly jwtService: JwtService,
    private readonly proposalTemplateService: ProposalTemplateService,
  ) {}

  async create(proposalDto: CreateProposalDto): Promise<OperationResult<ProposalDto>> {
    const model = new this.proposalModel({
      opportunity_id: proposalDto.opportunityId,
      detailed_proposal: {
        proposal_name: proposalDto.proposalName,
        recipients: proposalDto.recipients,
      },
    });
    await model.save();
    return OperationResult.ok(new ProposalDto(model.toObject()));
  }

  async update(id: string, proposalDto: UpdateProposalDto): Promise<OperationResult<ProposalDto>> {
    const foundProposal = await this.proposalModel.findById(id);

    if (!foundProposal) {
      throw ApplicationException.EnitityNotFound(id);
    }

    const newData = {
      detailed_proposal: {} as IDetailedProposalSchema,
    } as Proposal;

    const { detailedProposal } = proposalDto;

    if (detailedProposal.isSelected) {
      newData.detailed_proposal.is_selected = detailedProposal.isSelected;
    }

    if (detailedProposal.proposalName) {
      newData.detailed_proposal.proposal_name = detailedProposal.proposalName;
    }

    if (detailedProposal.proposalValidityPeriod) {
      newData.detailed_proposal.proposal_validity_period = detailedProposal.proposalValidityPeriod;
    }

    if (detailedProposal.recipients) {
      newData.detailed_proposal.recipients = detailedProposal.recipients.filter(item => item.email !== '');
    }

    if (detailedProposal.templateId) {
      newData.detailed_proposal.template_id = detailedProposal.templateId;
    }

    if (!foundProposal.detailed_proposal.quote_data) {
      newData.system_design_id = proposalDto.systemDesignId;
      newData.quote_id = proposalDto.quoteId;
      newData.detailed_proposal.proposal_creation_date = new Date();
      newData.detailed_proposal.status = PROPOSAL_STATUS.CREATED;
      const [systemDesign, detailedQuote] = await Promise.all([
        this.systemDesignService.getOneById(proposalDto.systemDesignId),
        this.quoteService.getOneById(proposalDto.quoteId),
      ]);
      newData.detailed_proposal.system_design_data = systemDesign;
      newData.detailed_proposal.quote_data = detailedQuote;
    } else {
      newData.detailed_proposal = { ...foundProposal.toObject().detailed_proposal, ...newData.detailed_proposal };
    }

    const updatedModel = await this.proposalModel.findByIdAndUpdate(id, newData, { new: true });
    return OperationResult.ok(new ProposalDto(updatedModel.toObject()));
  }

  async getList(
    limit: number,
    skip: number,
    quoteId: string,
    opportunityId: string,
  ): Promise<OperationResult<Pagination<ProposalDto>>> {
    const condition = pickBy(
      {
        quote_id: quoteId,
        opportunity_id: opportunityId,
      },
      identity,
    );

    const [proposals, total] = await Promise.all([
      this.proposalModel.find(condition).limit(limit).skip(skip),
      this.proposalModel.countDocuments(condition),
    ]);

    return OperationResult.ok({
      data: proposals.map(proposal => new ProposalDto(proposal.toObject())),
      total,
    });
  }

  async getProposalDetails(id: string): Promise<OperationResult<ProposalDto>> {
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) {
      throw ApplicationException.EnitityNotFound(id);
    }

    const template = await this.proposalTemplateService.getOneById(proposal.detailed_proposal?.template_id);

    return OperationResult.ok(new ProposalDto({ ...proposal.toObject(), template }));
  }

  async generateLinkByAgent(proposalId: string): Promise<OperationResult<{ proposalLink: string }>> {
    // TODO: need to check role later
    const foundProposal = await this.proposalModel.findById(proposalId);
    if (!foundProposal) {
      throw ApplicationException.EnitityNotFound(proposalId);
    }

    const token = this.jwtService.sign(
      {
        proposalId: foundProposal._id,
        houseNumber: 'need to fix later',
        zipCode: 'need to fix later',
        isAgent: true,
      },
      { expiresIn: '5m' },
    );

    return OperationResult.ok({ proposalLink: process.env.PROPOSAL_PAGE.concat(`/${token}`) });
  }

  async sendRecipients(proposalId: string, user: CurrentUserType): Promise<OperationResult<boolean>> {
    const foundProposal = await this.proposalModel.findById(proposalId);
    if (!foundProposal) {
      throw ApplicationException.EnitityNotFound(proposalId);
    }

    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODE_MAILER_EMAIL,
        pass: process.env.NODE_MAILER_PASSWORD,
      },
    });

    const tokensByRecipients = foundProposal.detailed_proposal.recipients.map(item =>
      this.jwtService.sign(
        {
          proposalId: foundProposal._id,
          email: item.email,
          houseNumber: 'need to fix later',
          zipCode: 'need to fix later',
        },
        { expiresIn: `${foundProposal.detailed_proposal.proposal_validity_period}d` },
      ),
    );

    const linksByToken = tokensByRecipients.map(token => process.env.PROPOSAL_PAGE.concat(`/${token}`));
    const recipients = foundProposal.detailed_proposal.recipients.map(item => item.email);

    const source = proposalTemplate;
    const template = Handlebars.compile(source);

    await Promise.all(
      recipients.map((item, index) => {
        const data = {
          customerName: item.split('@')?.[0] ? item.split('@')[0] : 'Customer',
          proposalValidityPeriod: foundProposal.detailed_proposal.proposal_validity_period,
          recipientNotice: recipients.filter(i => i !== item).join(', ')
            ? `Please note, this proposal has been shared with additinal email IDs as per your request: ${recipients
                .filter(i => i !== item)
                .join(', ')}`
            : '',
          proposalLink: linksByToken[index],
        };

        const htmlToSend = template(data);
        transporter.sendMail({
          from: process.env.NODE_MAILER_EMAIL,
          to: item,
          subject: 'Proposal Invitation',
          html: htmlToSend,
        });
      }),
    );

    return OperationResult.ok(true);
  }

  async verifyProposalToken(
    data: ValidateProposalDto,
  ): Promise<OperationResult<{ isAgent: boolean; proposalDetail: ProposalDto }>> {
    let res: any;

    try {
      res = await this.jwtService.verifyAsync(data.token, {
        secret: process.env.PROPOSAL_JWT_SECRET,
        ignoreExpiration: false,
      });
    } catch (error) {
      throw new UnauthorizedException();
    }

    if (!res.isAgent && !data.customerInformation) {
      return OperationResult.ok({
        isAgent: false,
        proposalDetail: {} as any,
      });
    }

    const proposal = await this.proposalModel.findById(res.proposalId);
    if (!proposal) {
      throw ApplicationException.EnitityNotFound(res.proposalId);
    }

    const template = await this.proposalTemplateService.getOneById(proposal.detailed_proposal?.template_id);

    return OperationResult.ok({
      isAgent: res.isAgent || false,
      proposalDetail: new ProposalDto({ ...proposal.toObject(), template }),
    });
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-
}
