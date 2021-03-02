import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import * as Handlebars from 'handlebars';
import { identity, pickBy } from 'lodash';
import { Model } from 'mongoose';
import { ContactService } from 'src/contacts/contact.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { ProposalTemplateService } from 'src/proposal-templates/proposal-template.service';
import { UserService } from 'src/users/user.service';
import { OperationResult, Pagination } from '../app/common';
import { CurrentUserType } from '../app/securities';
import { EmailService } from '../emails/email.service';
import { SystemDesignService } from '../system-designs/system-design.service';
import { ApplicationException } from '../app/app.exception';
import { QuoteService } from '../quotes/quote.service';
import { PROPOSAL_ANALYTIC_TYPE, PROPOSAL_STATUS } from './constants';
import { IDetailedProposalSchema, Proposal, PROPOSAL } from './proposal.schema';
import { CreateProposalDto } from './req/create-proposal.dto';
import { UpdateProposalDto } from './req/update-proposal.dto';
import { CustomerInformationDto, ValidateProposalDto } from './req/validate-proposal.dto';
import { ProposalDto } from './res/proposal.dto';
import proposalTemplate from './template-html/proposal-template';
import { ProposalAnalytic, PROPOSAL_ANALYTIC } from './schemas/proposal-analytic.schema';
import { SaveProposalAnalyticDto } from './req/save-proposal-analytic.dto';
import { GetPresignedUrlService } from './sub-services/s3.service';
import { stringify } from 'querystring';

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
      { expiresIn: '5m', secret: process.env.PROPOSAL_JWT_SECRET },
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

    await this.proposalModel.findByIdAndUpdate(infoProposalAfterInsert._id, newData, {
      new: true,
    });

    return OperationResult.ok(new ProposalDto(newData));
  }

  async update(id: string, proposalDto: UpdateProposalDto): Promise<OperationResult<ProposalDto>> {
    const foundProposal = await this.proposalModel.findById(id);

    if (!foundProposal) {
      throw ApplicationException.EnitityNotFound(id);
    }

    const newData = {
      detailed_proposal: {} as IDetailedProposalSchema,
    } as Proposal;

    const {
      isSelected, proposalValidityPeriod, proposalName, recipients, pdfFileUrl, htmlFileUrl,
    } = proposalDto;

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
      newData.detailed_proposal.recipients = recipients.filter((item) => item.email !== '');
    }

    if (pdfFileUrl) {
      newData.detailed_proposal.pdf_file_url = pdfFileUrl;
    }

    if (htmlFileUrl) {
      newData.detailed_proposal.html_file_url = htmlFileUrl;
    }

    newData.detailed_proposal = { ...foundProposal.toObject().detailed_proposal, ...newData.detailed_proposal };

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
      data: proposals.map((proposal) => new ProposalDto(proposal.toObject())),
      total,
    });
  }

  async getProposalDetails(id: string): Promise<OperationResult<ProposalDto>> {
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) {
      throw ApplicationException.EnitityNotFound(id);
    }

    const opportunity = await this.opportunityService.getDetailById(proposal.opportunity_id);
    if (!opportunity) {
      throw ApplicationException.EnitityNotFound(`OpportunityId: ${proposal.opportunity_id}`);
    }

    const [contact, recordOwner, template] = await Promise.all([
      this.contactService.getContactById(opportunity.contactId),
      this.userService.getUserById(opportunity.recordOwner),
      this.proposalTemplateService.getOneById(proposal.detailed_proposal?.template_id),
    ]);

    return OperationResult.ok(
      new ProposalDto({
        ...proposal.toObject(),
        template,
        customer: { ...contact, address: contact.address1, zipCode: contact.zip },
        agent: {
          firstName: recordOwner.profile.firstName,
          lastName: recordOwner.profile.lastName,
          email: recordOwner.emails[0].address,
          phoneNumber: recordOwner.profile.cellPhone,
        },
      }),
    );
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
      { expiresIn: '1d', secret: process.env.PROPOSAL_JWT_SECRET },
    );

    return OperationResult.ok({ proposalLink: process.env.PROPOSAL_URL.concat(`/?s=${token}`) });
  }

  async sendRecipients(proposalId: string, user: CurrentUserType): Promise<OperationResult<boolean>> {
    const foundProposal = await this.proposalModel.findById(proposalId);
    if (!foundProposal) {
      throw ApplicationException.EnitityNotFound(proposalId);
    }

    const tokensByRecipients = foundProposal.detailed_proposal.recipients.map((item) => this.jwtService.sign(
      {
        proposalId: foundProposal._id,
        email: item.email,
        houseNumber: 'myhouse123', // TO BE REMOVED AFTER MERGED
        zipCode: 7000000, // TO BE REMOVED AFTER MERGED
      },
      { expiresIn: `${foundProposal.detailed_proposal.proposal_validity_period}d` },
    ));

    const linksByToken = tokensByRecipients.map(token => process.env.PROPOSAL_URL.concat(`/?s=${token}`));
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
        proposalDetail: null,
      });
    }

    // Role: customer - Stage: 2
    if (!tokenPayload.isAgent && !this.validateCustomerInformation(data.customerInformation, tokenPayload)) {
      throw ApplicationException.ValidationFailed('Incorrect customer information.');
    }

    const proposal = await this.proposalModel.findById(tokenPayload.proposalId);
    if (!proposal) {
      throw ApplicationException.EnitityNotFound(tokenPayload.proposalId);
    }

    const template = await this.proposalTemplateService.getOneById(proposal.detailed_proposal?.template_id);

    return OperationResult.ok({
      isAgent: !!tokenPayload.isAgent,
      proposalDetail: new ProposalDto({ ...proposal.toObject(), template }),
    });
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  validateCustomerInformation(customerInformation: CustomerInformationDto, tokenPayload): boolean {
    return Object.keys(customerInformation).every((key) => customerInformation[key] === tokenPayload[key]);
  }

  async countByOpportunityId(opportunityId: string): Promise<number> {
    return await this.proposalModel.countDocuments({ opportunity_id: opportunityId });
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
      throw ApplicationException.EnitityNotFound(proposalId);
    }
    const foundAnalytic = await this.proposalAnalyticModel.findOne({ proposal_id: proposalId, view_by: viewBy });
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
    } else {
      const dataToUpdate =
        type === PROPOSAL_ANALYTIC_TYPE.DOWNLOAD
          ? {
              downloads: [...foundAnalytic.toObject().downloads, new Date()],
              views: foundAnalytic.toObject().views,
            }
          : {
              views: [...foundAnalytic.toObject().views, new Date()],
              downloads: foundAnalytic.toObject().downloads,
            };
      await this.proposalAnalyticModel.findByIdAndUpdate(foundAnalytic._id, dataToUpdate);
      return OperationResult.ok(true);
    }
  }

  async getPreSignedObjectUrl(
    fileName: string,
    fileType: string,
    token: string,
    isSolarQuoteTool: boolean,
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

    const url = await this.getPresignedUrlService.getPresignedUrl(fileName, fileType);
    return OperationResult.ok(url);
  }
}
