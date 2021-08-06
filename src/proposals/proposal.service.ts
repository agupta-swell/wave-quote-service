import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import axios from 'axios';
import { IncomingMessage } from 'http';
import { identity, pickBy, sumBy } from 'lodash';
import { ObjectId, LeanDocument, Model } from 'mongoose';
import { ContactService } from 'src/contacts/contact.service';
import { ContractService } from 'src/contracts/contract.service';
import { CustomerPaymentService } from 'src/customer-payments/customer-payment.service';
import { DocusignCommunicationService } from 'src/docusign-communications/docusign-communication.service';
import { IGenericObject } from 'src/docusign-communications/typing';
import { DocusignTemplateMasterService } from 'src/docusign-templates-master/docusign-template-master.service';
import { GsProgramsService } from 'src/gs-programs/gs-programs.service';
import { LeaseSolverConfigService } from 'src/lease-solver-configs/lease-solver-config.service';
import { IGetDetail } from 'src/lease-solver-configs/typing';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { ProposalTemplateService } from 'src/proposal-templates/proposal-template.service';
import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { UserService } from 'src/users/user.service';
import { UtilityService } from 'src/utilities/utility.service';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { ApplicationException } from '../app/app.exception';
import { OperationResult, Pagination } from '../app/common';
import { EmailService } from '../emails/email.service';
import { QuoteService } from '../quotes/quote.service';
import { SystemDesignService } from '../system-designs/system-design.service';
import { PROPOSAL_ANALYTIC_TYPE, PROPOSAL_STATUS } from './constants';
import { Proposal, PROPOSAL } from './proposal.schema';
import {
  CreateProposalDto,
  CustomerInformationDto,
  SaveProposalAnalyticDto,
  UpdateProposalDto,
  ValidateProposalDto,
} from './req';
import { SignerDetailDto, TemplateDetailDto } from './req/send-sample-contract.dto';
import { ProposalSendSampleContractResultDto } from './res/proposal-send-sample-contract.dto';
import { ProposalDto } from './res/proposal.dto';
import { ProposalAnalytic, PROPOSAL_ANALYTIC } from './schemas/proposal-analytic.schema';
import { PROPOSAL_EMAIL_TEMPLATE } from './template-html/proposal-template';

@Injectable()
export class ProposalService {
  private BUCKET_NAME = process.env.PROPOSAL_AWS_BUCKET || 'proposal-data-development';

  constructor(
    @InjectModel(PROPOSAL) private proposalModel: Model<Proposal>,
    @InjectModel(PROPOSAL_ANALYTIC) private proposalAnalyticModel: Model<ProposalAnalytic>,
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
    @Inject(forwardRef(() => QuoteService))
    private readonly quoteService: QuoteService,
    private readonly jwtService: JwtService,
    private readonly proposalTemplateService: ProposalTemplateService,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => OpportunityService))
    private readonly opportunityService: OpportunityService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => ContactService))
    private readonly contactService: ContactService,
    private readonly customerPaymentService: CustomerPaymentService,
    @Inject(forwardRef(() => UtilityService))
    private readonly utilityService: UtilityService,
    private readonly gsProgramsService: GsProgramsService,
    private readonly utilityProgramMasterService: UtilityProgramMasterService,
    private readonly docusignCommunicationService: DocusignCommunicationService,
    private readonly leaseSolverConfigService: LeaseSolverConfigService,
    private readonly s3Service: S3Service,
    @Inject(forwardRef(() => DocusignTemplateMasterService))
    private readonly docusignTemplateMasterService: DocusignTemplateMasterService,
  ) {}

  async create(proposalDto: CreateProposalDto): Promise<OperationResult<ProposalDto>> {
    const [systemDesign, detailedQuote] = await Promise.all([
      this.systemDesignService.getOneById(proposalDto.systemDesignId),
      this.quoteService.getOneById(proposalDto.quoteId),
    ]);

    const thumbnail = systemDesign?.thumbnail;

    if (!thumbnail) {
      throw ApplicationException.ServiceError();
    }

    const { keyName, bucketName } = this.s3Service.getLocationFromUrl(thumbnail);

    const newKeyName = `proposal_${keyName}`;

    await this.s3Service.copySource(bucketName, keyName, bucketName, newKeyName, 'public-read');

    const model = new this.proposalModel({
      opportunityId: proposalDto.opportunityId,
      systemDesignId: proposalDto.systemDesignId,
      quoteId: proposalDto.quoteId,
      detailedProposal: {
        proposalName: proposalDto.proposalName,
        recipients: proposalDto.detailedProposal.recipients,
        isSelected: proposalDto.detailedProposal.isSelected,
        proposalValidityPeriod: proposalDto.detailedProposal.proposalValidityPeriod,
        templateId: proposalDto.detailedProposal.templateId,
        proposalCreationDate: new Date(),
        status: PROPOSAL_STATUS.CREATED,
        quoteData: detailedQuote,
        systemDesignData: systemDesign,
      },
    });

    model.detailedProposal.systemDesignData.thumbnail = this.s3Service.buildUrlFromKey(bucketName, newKeyName);

    // Generate PDF and HTML file then get File Url
    const infoProposalAfterInsert = await model.save();
    const token = this.jwtService.sign(
      {
        proposalId: infoProposalAfterInsert._id,
        isAgent: true,
      },
      {
        expiresIn: '50m',
        secret: process.env.PROPOSAL_JWT_SECRET,
      },
    );

    const { data } = await axios.get(`${process.env.PROPOSAL_URL}/generate?token=${token}`);

    if (data?.pdfFileUrl) {
      infoProposalAfterInsert.detailedProposal.pdfFileUrl = data.pdfFileUrl;
    }
    if (data?.htmlFileUrl) {
      infoProposalAfterInsert.detailedProposal.htmlFileUrl = data.htmlFileUrl;
    }

    await infoProposalAfterInsert.save();
    return OperationResult.ok(strictPlainToClass(ProposalDto, infoProposalAfterInsert.toJSON()));
  }

  async update(id: ObjectId, proposalDto: UpdateProposalDto): Promise<OperationResult<ProposalDto>> {
    const foundProposal = await this.proposalModel.findById(id);

    if (!foundProposal) {
      throw ApplicationException.EntityNotFound(id.toString());
    }

    const { isSelected, proposalValidityPeriod, proposalName, recipients, pdfFileUrl, htmlFileUrl } = proposalDto;

    foundProposal.detailedProposal.isSelected = isSelected;
    foundProposal.detailedProposal.proposalName = proposalName;
    foundProposal.detailedProposal.proposalValidityPeriod = proposalValidityPeriod;
    foundProposal.detailedProposal.recipients = recipients;
    foundProposal.detailedProposal.pdfFileUrl = pdfFileUrl;
    foundProposal.detailedProposal.htmlFileUrl = htmlFileUrl;

    await foundProposal.save();

    return OperationResult.ok(strictPlainToClass(ProposalDto, foundProposal.toJSON()));
  }

  async getList(
    limit: number,
    skip: number,
    quoteId: string,
    opportunityId: string,
  ): Promise<OperationResult<Pagination<ProposalDto>>> {
    const condition = pickBy(
      {
        quoteId,
        opportunityId,
      },
      identity,
    );

    const [proposals, total] = await Promise.all([
      this.proposalModel.find(condition).limit(limit).skip(skip).lean(),
      this.proposalModel.countDocuments(condition),
    ]);

    return OperationResult.ok({
      data: strictPlainToClass(ProposalDto, proposals),
      total,
    });
  }

  async getProposalDetails(id: ObjectId): Promise<OperationResult<ProposalDto>> {
    const proposal = await this.proposalModel.findById(id).lean();
    if (!proposal) {
      throw ApplicationException.EntityNotFound(id.toString());
    }

    const requiredData = await this.getProposalRequiredData(proposal);

    return OperationResult.ok(
      strictPlainToClass(ProposalDto, {
        ...proposal,
        ...requiredData,
      }),
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

  async sendRecipients(proposalId: ObjectId): Promise<OperationResult<boolean>> {
    const foundProposal = await this.proposalModel.findById(proposalId);
    if (!foundProposal) {
      throw ApplicationException.EntityNotFound(proposalId.toString());
    }

    const tokensByRecipients = foundProposal.detailedProposal.recipients.map(item =>
      this.jwtService.sign(
        {
          proposalId: foundProposal._id,
          email: item.email,
          houseNumber: 'myhouse123', // TO BE REMOVED AFTER MERGED
          zipCode: 7000000, // TO BE REMOVED AFTER MERGED
          isAgent: true, // TODO: SHOULD BE REMOVED AFTER DEMO
        },
        {
          expiresIn: `${foundProposal.detailedProposal.proposalValidityPeriod}d`,
          secret: process.env.PROPOSAL_JWT_SECRET,
        },
      ),
    );

    const linksByToken = tokensByRecipients.map(token => (process.env.PROPOSAL_URL || '').concat(`/?s=${token}`));
    const recipients = foundProposal.detailedProposal.recipients.map(item => item.email);

    await Promise.all(
      recipients.map((recipient, index) => {
        const data = {
          customerName: recipient.split('@')?.[0] ? recipient.split('@')[0] : 'Customer',
          proposalValidityPeriod: foundProposal.detailedProposal.proposalValidityPeriod,
          recipientNotice: recipients.filter(i => i !== recipient).join(', ')
            ? `Please note, this proposal has been shared with additional email IDs as per your request: ${recipients
                .filter(i => i !== recipient)
                .join(', ')}`
            : '',
          proposalLink: linksByToken[index],
        };
        this.emailService.sendMailByTemplate(recipient, 'Proposal Invitation', PROPOSAL_EMAIL_TEMPLATE, data);
        // this.emailService.sendMail(recipient, htmlToSend, 'Proposal Invitation');
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
      proposalDetail: strictPlainToClass(ProposalDto, { ...proposal, ...requiredData }),
    });
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  validateCustomerInformation(customerInformation: CustomerInformationDto, tokenPayload): boolean {
    return Object.keys(customerInformation).every(key => customerInformation[key] === tokenPayload[key]);
  }

  async countByOpportunityId(opportunityId: string): Promise<number> {
    const counter = await this.proposalModel.countDocuments({ opportunityId });
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

    const foundAnalytic = await this.proposalAnalyticModel.findOne({ proposalId, viewBy });
    if (!foundAnalytic) {
      const dataToSave =
        type === PROPOSAL_ANALYTIC_TYPE.DOWNLOAD
          ? { downloads: [new Date()], views: [] }
          : { views: [new Date()], downloads: [] };
      const model = new this.proposalAnalyticModel({
        proposalId,
        viewBy,
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
        if (error.constructor.name === 'JsonWebTokenError') throw new UnauthorizedException();
        throw error;
      }
    }

    const url = await this.s3Service.getUrl(this.BUCKET_NAME, fileName, {
      extName: fileType,
      downloadable: isGetDownloadLink,
      expires: 300,
      rootDir: fileName,
      responseContentType: !isGetDownloadLink,
    });
    return OperationResult.ok(url);
  }

  async getProposalRequiredData(proposal: LeanDocument<Proposal>): Promise<Partial<ProposalDto>> {
    const opportunity = await this.opportunityService.getDetailById(proposal.opportunityId);
    if (!opportunity) {
      throw ApplicationException.EntityNotFound(`OpportunityId: ${proposal.opportunityId}`);
    }

    const [contact, recordOwner, template] = await Promise.all([
      this.contactService.getContactById(opportunity.contactId),
      this.userService.getUserById(opportunity.recordOwner),
      this.proposalTemplateService.getOneById(proposal.detailedProposal?.templateId),
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

  async sendSampleContract(
    proposalId: ObjectId,
    templateDetails: TemplateDetailDto[],
    signerDetails: SignerDetailDto[],
  ): Promise<OperationResult<ProposalSendSampleContractResultDto>> {
    const proposal = await this.proposalModel.findById(proposalId);

    if (!proposal) throw ApplicationException.EntityNotFound(`ProposalId: ${proposalId}`);

    const quote = proposal.detailedProposal.quoteData;

    const opportunity = await this.opportunityService.getDetailById(proposal.opportunityId);
    if (!opportunity) {
      throw ApplicationException.EntityNotFound(`OpportunityId: ${proposal.opportunityId}`);
    }

    const [contact, recordOwner] = await Promise.all([
      this.contactService.getContactById(opportunity.contactId),
      this.userService.getUserById(opportunity.recordOwner),
    ]);

    const fundingSourceType = proposal.detailedProposal.quoteData.quoteFinanceProduct.financeProduct.productType;

    const [customerPayment, utilityName, roofTopDesign, systemDesign] = await Promise.all([
      this.customerPaymentService.getCustomerPaymentByOpportunityId(proposal.opportunityId),
      this.utilityService.getUtilityName(opportunity.utilityId),
      this.systemDesignService.getRoofTopDesignById(proposal.systemDesignId),
      this.systemDesignService.getOneById(proposal.systemDesignId),
    ]);

    const assignedMember = await this.userService.getUserById(opportunity.assignedMember);

    // Get gsProgram
    const incentiveDetails = quote.quoteFinanceProduct.incentiveDetails[0];

    const gsProgramSnapshotId = incentiveDetails.detail.gsProgramSnapshot.id;

    const gsProgram = await this.gsProgramsService.getById(gsProgramSnapshotId);

    // Get utilityProgramMaster
    const utilityProgramMaster = gsProgram
      ? await this.utilityProgramMasterService.getLeanById(gsProgram.utilityProgramId)
      : null;

    // Get lease solver config
    const leaseProductAttribute = quote.quoteFinanceProduct.financeProduct.productAttribute as ILeaseProductAttributes;
    const query: IGetDetail = {
      tier: 'DTC',
      isSolar: systemDesign!.isSolar,
      utilityProgramName: utilityProgramMaster ? utilityProgramMaster.utilityProgramName : '',
      contractTerm: leaseProductAttribute.leaseTerm,
      storageSize: sumBy(quote.quoteCostBuildup.storageQuoteDetails, item => item.storageModelDataSnapshot.sizekWh),
      storageManufacturer: 'Tesla',
      rateEscalator: leaseProductAttribute.rateEscalator,
      capacityKW: systemDesign!.systemProductionData.capacityKW,
      productivity: systemDesign!.systemProductionData.productivity,
    };

    const leaseSolverConfig = await this.leaseSolverConfigService.getDetailByConditions(query);

    const sampleContact = {
      ...contact,
      firstName: 'Sample',
      lastName: 'Contract',
    };
    const genericObject: IGenericObject = {
      signerDetails: [],
      opportunity,
      quote,
      recordOwner: recordOwner || ({} as any),
      contact: sampleContact as any,
      customerPayment: customerPayment || ({} as any),
      utilityName: utilityName?.split(' - ')[1] || 'none',
      roofTopDesign: roofTopDesign || ({} as any),
      isCash: fundingSourceType === 'cash',
      assignedMember,
      gsProgram,
      utilityProgramMaster,
      leaseSolverConfig,
    };

    const templateDetailsData = await Promise.all(
      templateDetails.map(({ id }) => this.docusignTemplateMasterService.getTemplateMasterById(id)),
    );

    const docusignResponse = await this.docusignCommunicationService.sendContractToDocusign(
      proposal._id.toString(),
      templateDetailsData,
      signerDetails,
      genericObject,
      true,
    );

    if (docusignResponse.status === 'SUCCESS') {
      proposal.detailedProposal.envelopeId = docusignResponse.contractingSystemReferenceId;
      await proposal.save();
    }

    // return OperationResult.ok(new SendContractDto(status, statusDescription, updatedContract));
    const document = await this.docusignCommunicationService.downloadContract(
      docusignResponse.contractingSystemReferenceId as string,
    );

    const timestamp = Date.now();
    const fileName = `${docusignResponse.contractingSystemReferenceId as string}_${timestamp}.pdf`;

    try {
      const s3UploadResult = await this.saveToStorage(document, fileName);
      // await proposal.
      proposal.detailedProposal.sampleContractUrl = s3UploadResult.Location;
      await proposal.save();
      return OperationResult.ok({
        url: s3UploadResult.Location,
      });
    } catch (err) {
      // TODO use Logger
      console.log('s3 upload error', err);
      throw ApplicationException.ServiceError();
    }
  }

  public async existByQuoteId(quoteId: string): Promise<boolean> {
    const doc = await this.proposalModel.find({ quoteId }, { _id: 1 }).limit(1);
    return !!doc.length;
  }

  public async existBySystemDesignId(systemDesignId: string): Promise<boolean> {
    const doc = await this.proposalModel.find({ systemDesignId }, { _id: 1 }).limit(1);
    return !!doc.length;
  }

  private saveToStorage(doc: IncomingMessage, fileName: string): Promise<ManagedUpload.SendData> {
    return new Promise((resolve, reject) => {
      doc.pipe(
        this.s3Service.putStream(fileName, this.BUCKET_NAME, 'application/pdf', 'public-read', (err, data) => {
          if (err) {
            return reject(err);
          }

          return resolve(data);
        }),
      );
    });
  }
}
