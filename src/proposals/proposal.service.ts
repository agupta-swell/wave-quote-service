import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import * as Handlebars from 'handlebars';
import { identity, pickBy } from 'lodash';
import { LeanDocument, Model } from 'mongoose';
import { ContactService } from 'src/contacts/contact.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { ProposalTemplateService } from 'src/proposal-templates/proposal-template.service';
import { UserService } from 'src/users/user.service';
import { ApplicationException } from '../app/app.exception';
import { OperationResult, Pagination } from '../app/common';
import { CurrentUserType } from '../app/securities';
import { EmailService } from '../emails/email.service';
import { QuoteService } from '../quotes/quote.service';
import { SystemDesignService } from '../system-designs/system-design.service';
import { PROPOSAL_ANALYTIC_TYPE, PROPOSAL_STATUS } from './constants';
import { IDetailedProposalSchema, Proposal, PROPOSAL } from './proposal.schema';
import {
  CreateProposalDto,
  CustomerInformationDto,
  SaveProposalAnalyticDto,
  UpdateProposalDto,
  ValidateProposalDto,
} from './req';
import { ProposalDto } from './res/proposal.dto';
import { ProposalAnalytic, PROPOSAL_ANALYTIC } from './schemas/proposal-analytic.schema';
import { GetPresignedUrlService } from './sub-services/s3.service';
import proposalTemplate from './template-html/proposal-template';

@Injectable()
export class ProposalService {
  constructor(
    @InjectModel(PROPOSAL) private proposalModel: Model<Proposal>,
    @InjectModel(PROPOSAL_ANALYTIC) private proposalAnalyticModel: Model<ProposalAnalytic>,
    private readonly systemDesignService: SystemDesignService,
    private readonly quoteService: QuoteService,
    private readonly jwtService: JwtService,
    private readonly proposalTemplateService: ProposalTemplateService,
    private readonly emailService: EmailService,
    private readonly opportunityService: OpportunityService,
    private readonly userService: UserService,
    private readonly contactService: ContactService,
    private readonly getPresignedUrlService: GetPresignedUrlService,
  ) {}

  async create(proposalDto: CreateProposalDto): Promise<OperationResult<ProposalDto>> {
    const [systemDesign, detailedQuote] = await Promise.all([
      this.systemDesignService.getOneById(proposalDto.systemDesignId),
      this.quoteService.getOneById(proposalDto.quoteId),
    ]);

    const model = new this.proposalModel({
      opportunity_id: proposalDto.opportunityId,
      system_design_id: proposalDto.systemDesignId,
      quote_id: proposalDto.quoteId,
      detailed_proposal: {
        proposal_name: proposalDto.proposalName,
        recipients: proposalDto.detailedProposal.recipients,
        is_selected: proposalDto.detailedProposal.isSelected,
        proposal_validity_period: proposalDto.detailedProposal.proposalValidityPeriod,
        template_id: proposalDto.detailedProposal.templateId,
        proposal_creation_date: new Date(),
        status: PROPOSAL_STATUS.CREATED,
        quote_data: detailedQuote,
        system_design_data: systemDesign,
      },
    });

    // Generate PDF and HTML file then get File Url
    const infoProposalAfterInsert = await model.save();
    const token = this.jwtService.sign(
      {
        proposalId: infoProposalAfterInsert._id,
        isAgent: true,
      },
      {
        expiresIn: '5m',
        secret: process.env.PROPOSAL_JWT_SECRET,
      },
    );

    const { data } = await axios.get(`${process.env.PROPOSAL_URL}/generate?token=${token}`);
    const newData = {
      detailed_proposal: {} as IDetailedProposalSchema,
      opportunity_id: proposalDto.opportunityId,
      system_design_id: proposalDto.systemDesignId,
      quote_id: proposalDto.quoteId,
    } as Proposal;

    if (data?.pdfFileUrl) {
      newData.detailed_proposal.pdf_file_url = data.pdfFileUrl;
    }
    if (data?.htmlFileUrl) {
      newData.detailed_proposal.html_file_url = data.htmlFileUrl;
    }

    newData.detailed_proposal = { ...model.toObject().detailed_proposal, ...newData.detailed_proposal };
    newData._id = infoProposalAfterInsert._id;

    await this.proposalModel.findByIdAndUpdate(infoProposalAfterInsert._id, newData, {
      new: true,
    });

    return OperationResult.ok(new ProposalDto(newData));
  }

  async update(id: string, proposalDto: UpdateProposalDto): Promise<OperationResult<ProposalDto>> {
    const foundProposal = await this.proposalModel.findById(id).lean();

    if (!foundProposal) {
      throw ApplicationException.EntityNotFound(id);
    }

    const newData = {
      detailed_proposal: {} as IDetailedProposalSchema,
    } as Proposal;

    const { isSelected, proposalValidityPeriod, proposalName, recipients, pdfFileUrl, htmlFileUrl } = proposalDto;

    if (isSelected) {
      newData.detailed_proposal.is_selected = isSelected;
    }

    if (proposalName) {
      newData.detailed_proposal.proposal_name = proposalName;
    }

    if (proposalValidityPeriod) {
      newData.detailed_proposal.proposal_validity_period = proposalValidityPeriod;
    }

    if (recipients) {
      newData.detailed_proposal.recipients = recipients.filter(item => item.email !== '');
    }

    if (pdfFileUrl) {
      newData.detailed_proposal.pdf_file_url = pdfFileUrl;
    }

    if (htmlFileUrl) {
      newData.detailed_proposal.html_file_url = htmlFileUrl;
    }

    newData.detailed_proposal = { ...foundProposal.detailed_proposal, ...newData.detailed_proposal };

    const updatedModel = await this.proposalModel.findByIdAndUpdate(id, newData, { new: true }).lean();
    return OperationResult.ok(new ProposalDto(updatedModel || ({} as any)));
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
      this.proposalModel.find(condition).limit(limit).skip(skip).lean(),
      this.proposalModel.countDocuments(condition),
    ]);

    return OperationResult.ok({
      data: proposals.map(proposal => new ProposalDto(proposal)),
      total,
    });
  }

  async getProposalDetails(id: string): Promise<OperationResult<ProposalDto>> {
    const proposal = await this.proposalModel.findById(id).lean();
    if (!proposal) {
      throw ApplicationException.EntityNotFound(id);
    }

    const requiredData = await this.getProposalRequiredData(proposal);

    return OperationResult.ok(
      new ProposalDto({
        ...proposal,
        ...requiredData,
      } as any),
    );
  }

  async generateLinkByAgent(proposalId: string): Promise<OperationResult<{ proposalLink: string }>> {
    // TODO: need to check role later
    const foundProposal = await this.proposalModel.findById(proposalId);
    if (!foundProposal) {
      throw ApplicationException.EntityNotFound(proposalId);
    }

    const token = this.jwtService.sign(
      {
        proposalId: foundProposal._id,
        houseNumber: 'need to fix later',
        zipCode: 'need to fix later',
        isAgent: true,
      },
      {
        expiresIn: '1d',
        secret: process.env.PROPOSAL_JWT_SECRET,
      },
    );

    return OperationResult.ok({ proposalLink: (process.env.PROPOSAL_URL || '').concat(`/?s=${token}`) });
  }

  async sendRecipients(proposalId: string, user: CurrentUserType): Promise<OperationResult<boolean>> {
    const foundProposal = await this.proposalModel.findById(proposalId);
    if (!foundProposal) {
      throw ApplicationException.EntityNotFound(proposalId);
    }

    const tokensByRecipients = foundProposal.detailed_proposal.recipients.map(item =>
      this.jwtService.sign(
        {
          proposalId: foundProposal._id,
          email: item.email,
          houseNumber: 'myhouse123', // TO BE REMOVED AFTER MERGED
          zipCode: 7000000, // TO BE REMOVED AFTER MERGED
          isAgent: true, //TODO: SHOULD BE REMOVED AFTER DEMO
        },
        {
          expiresIn: `${foundProposal.detailed_proposal.proposal_validity_period}d`,
          secret: process.env.PROPOSAL_JWT_SECRET,
        },
      ),
    );

    const linksByToken = tokensByRecipients.map(token => (process.env.PROPOSAL_URL || '').concat(`/?s=${token}`));
    const recipients = foundProposal.detailed_proposal.recipients.map(item => item.email);

    const source = proposalTemplate;
    const template = Handlebars.compile(source);

    await Promise.all(
      recipients.map((recipient, index) => {
        const data = {
          customerName: recipient.split('@')?.[0] ? recipient.split('@')[0] : 'Customer',
          proposalValidityPeriod: foundProposal.detailed_proposal.proposal_validity_period,
          recipientNotice: recipients.filter(i => i !== recipient).join(', ')
            ? `Please note, this proposal has been shared with additional email IDs as per your request: ${recipients
                .filter(i => i !== recipient)
                .join(', ')}`
            : '',
          proposalLink: linksByToken[index],
        };

        const htmlToSend = template(data);
        this.emailService.sendMail(recipient, htmlToSend, 'Proposal Invitation');
      }),
    );

    return OperationResult.ok(true);
  }

  async verifyProposalToken(
    data: ValidateProposalDto,
  ): Promise<OperationResult<{ isAgent: boolean; proposalDetail: ProposalDto }>> {
    let tokenPayload: any;

    try {
      tokenPayload = await this.jwtService.verifyAsync(data.token, {
        secret: process.env.PROPOSAL_JWT_SECRET,
        ignoreExpiration: false,
      });
    } catch (error) {
      throw new UnauthorizedException();
    }

    // Role: customer - Stage: 1
    if (!tokenPayload.isAgent && !data.customerInformation) {
      return OperationResult.ok({
        isAgent: false,
        proposalDetail: null as any,
      });
    }

    // Role: customer - Stage: 2
    if (!tokenPayload.isAgent && !this.validateCustomerInformation(data.customerInformation, tokenPayload)) {
      throw ApplicationException.ValidationFailed('Incorrect customer information.');
    }

    const proposal = await this.proposalModel.findById(tokenPayload.proposalId).lean();
    if (!proposal) {
      throw ApplicationException.EntityNotFound(tokenPayload.proposalId);
    }

    const requiredData = await this.getProposalRequiredData(proposal);

    return OperationResult.ok({
      isAgent: !!tokenPayload.isAgent,
      proposalDetail: new ProposalDto({ ...proposal, ...requiredData } as any),
    });
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  validateCustomerInformation(customerInformation: CustomerInformationDto, tokenPayload): boolean {
    return Object.keys(customerInformation).every(key => customerInformation[key] === tokenPayload[key]);
  }

  async countByOpportunityId(opportunityId: string): Promise<number> {
    const counter = await this.proposalModel.countDocuments({ opportunity_id: opportunityId });
    return counter;
  }

  async saveProposalAnalytic(analyticInfo: SaveProposalAnalyticDto): Promise<OperationResult<boolean>> {
    try {
      await this.jwtService.verifyAsync(analyticInfo.token, {
        secret: process.env.PROPOSAL_JWT_SECRET,
        ignoreExpiration: false,
      });
    } catch (error) {
      throw new UnauthorizedException();
    }

    const { proposalId, type, viewBy } = analyticInfo;
    const foundProposal = await this.proposalModel.exists({ _id: proposalId });
    if (!foundProposal) {
      throw ApplicationException.EntityNotFound(proposalId);
    }

    const foundAnalytic = await this.proposalAnalyticModel.findOne({ proposal_id: proposalId, view_by: viewBy }).lean();
    if (!foundAnalytic) {
      const dataToSave =
        type === PROPOSAL_ANALYTIC_TYPE.DOWNLOAD
          ? { downloads: [new Date()], views: [] }
          : { views: [new Date()], downloads: [] };
      const model = new this.proposalAnalyticModel({
        proposal_id: proposalId,
        view_by: viewBy,
        ...dataToSave,
      });
      await model.save();

      return OperationResult.ok(true);
    }

    const dataToUpdate =
      type === PROPOSAL_ANALYTIC_TYPE.DOWNLOAD
        ? {
            downloads: [...foundAnalytic.downloads, new Date()],
            views: foundAnalytic.views,
          }
        : {
            views: [...foundAnalytic.views, new Date()],
            downloads: foundAnalytic.downloads,
          };
    await this.proposalAnalyticModel.findByIdAndUpdate(foundAnalytic._id, dataToUpdate);
    return OperationResult.ok(true);
  }

  async getPreSignedObjectUrl(
    fileName: string,
    fileType: string,
    token: string,
    isSolarQuoteTool: boolean,
    isGetDownloadLink: boolean,
  ): Promise<OperationResult<string>> {
    if (!isSolarQuoteTool) {
      try {
        await this.jwtService.verifyAsync(token, {
          secret: process.env.PROPOSAL_JWT_SECRET,
          ignoreExpiration: false,
        });
      } catch (error) {
        throw new UnauthorizedException();
      }
    }
    let url = '';
    if (isGetDownloadLink) {
      url = await this.getPresignedUrlService.getDownloadLink(fileName, fileType);
    } else {
      url = await this.getPresignedUrlService.getPreviewLink(fileName, fileType);
    }
    return OperationResult.ok(url);
  }

  async getProposalRequiredData(proposal: LeanDocument<Proposal>): Promise<Partial<ProposalDto>> {
    const opportunity = await this.opportunityService.getDetailById(proposal.opportunity_id);
    if (!opportunity) {
      throw ApplicationException.EntityNotFound(`OpportunityId: ${proposal.opportunity_id}`);
    }

    const [contact, recordOwner, template] = await Promise.all([
      this.contactService.getContactById(opportunity.contactId),
      this.userService.getUserById(opportunity.recordOwner),
      this.proposalTemplateService.getOneById(proposal.detailed_proposal?.template_id),
    ]);

    return {
      template,
      customer: { ...contact, address: contact?.address1, zipCode: contact?.zip },
      agent: {
        firstName: recordOwner?.profile.firstName,
        lastName: recordOwner?.profile.lastName,
        email: recordOwner?.emails[0].address,
        phoneNumber: recordOwner?.profile.cellPhone,
      },
    } as any;
  }
}
