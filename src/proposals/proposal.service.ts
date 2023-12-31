/* eslint-disable no-plusplus */
import { forwardRef, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import axios from 'axios';
import { IncomingMessage } from 'http';
import { isNil, omitBy, pickBy, uniq } from 'lodash';
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { AccountService } from 'src/accounts/account.service';
import { AccountPhotoService } from 'src/account-photos/account-photo.service';
import { ILoggedInUser } from 'src/app/securities';
import { ContactService } from 'src/contacts/contact.service';
import { CustomerPaymentService } from 'src/customer-payments/customer-payment.service';
import { DocusignCommunicationService } from 'src/docusign-communications/docusign-communication.service';
import { IGenericObject } from 'src/docusign-communications/typing';
import { DocusignTemplateMasterService } from 'src/docusign-templates-master/docusign-template-master.service';
import { IBatteryDataSeries, INetLoad } from 'src/energy-profiles/energy-profile.interface';
import { EnergyProfileService } from 'src/energy-profiles/energy-profile.service';
import { getNetLoadTypical } from 'src/energy-profiles/utils';
import { FinancialProductsService } from 'src/financial-products/financial-product.service';
import { GsProgramsService } from 'src/gs-programs/gs-programs.service';
import { LeaseSolverConfigService } from 'src/lease-solver-configs/lease-solver-config.service';
import { Manufacturer } from 'src/manufacturers/manufacturer.schema';
import { ManufacturerService } from 'src/manufacturers/manufacturer.service';
import { ManufacturerDto } from 'src/manufacturers/res/manufacturer.dto';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { PropertyService } from 'src/property/property.service';
import { ProposalTemplateService } from 'src/proposal-templates/proposal-template.service';
import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { SystemProductionDto } from 'src/system-productions/res';
import { IEnergyProfileProduction } from 'src/system-productions/system-production.schema';
import { SystemProductionService } from 'src/system-productions/system-production.service';
import { UserService } from 'src/users/user.service';
import { PROPOSAL_PERIOD_MODE, PROPOSAL_VIEW_MODE } from 'src/utilities/constants';
import {
  calculateElectricVehicle,
  calculatePlannedUsageIncreasesKwh,
  calculatePoolUsageKwh,
  mapToResult,
} from 'src/utilities/operators';
import { GetDataSeriesResDto, IHistoricalUsage } from 'src/utilities/res';
import { GenabilityTariffDataDetail } from 'src/utilities/schemas/genability-tariff-caching.schema';
import { UtilityUsageDetails } from 'src/utilities/utility.schema';
import { UtilityService } from 'src/utilities/utility.service';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { ApplicationException } from '../app/app.exception';
import { OperationResult, Pagination } from '../app/common';
import { EmailService } from '../emails/email.service';
import { QuoteService } from '../quotes/quote.service';
import { SystemDesignService } from '../system-designs/system-design.service';
import { PROPOSAL_ANALYTIC_TYPE, PROPOSAL_FILTER_STATUS, PROPOSAL_STATUS } from './constants';
import { Proposal, PROPOSAL } from './proposal.schema';
import {
  CreateProposalDto,
  CustomerInformationDto,
  SaveProposalAnalyticDto,
  UpdateProposalDto,
  ValidateProposalDto,
} from './req';
import { SignerDetailDto, TemplateDetailDto } from './req/send-sample-contract.dto';
import { ProposalAnalyticDto } from './res/proposal-analytic.dto';
import { ProposalDto } from './res/proposal.dto';
import { ProposalAnalytic, PROPOSAL_ANALYTIC, TRACKING_TYPE } from './schemas/proposal-analytic.schema';

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
    private readonly propertyService: PropertyService,
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
    @Inject(forwardRef(() => FinancialProductsService))
    private readonly financialProductService: FinancialProductsService,
    private readonly manufacturerService: ManufacturerService,
    private readonly systemProductionService: SystemProductionService,
    private readonly energyProfileService: EnergyProfileService,
    private readonly accountPhotoService: AccountPhotoService,
    private readonly accountService: AccountService,
  ) {}

  async create(proposalDto: CreateProposalDto): Promise<OperationResult<ProposalDto>> {
    const [systemDesign, detailedQuote, proposalTemplate] = await Promise.all([
      this.systemDesignService.getOneById(proposalDto.systemDesignId),
      this.quoteService.getOneById(proposalDto.quoteId),
      this.proposalTemplateService.getOneById(proposalDto.detailedProposal.templateId),
    ]);

    if (!systemDesign) {
      throw new NotFoundException(`No System Design found with id ${proposalDto.systemDesignId}`);
    }

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
      proposalView: proposalDto.proposalView,
      proposalPeriod: proposalDto.proposalPeriod,
      proposalMonthIndex: proposalDto.proposalMonthIndex,
    });

    const thumbnail = systemDesign?.thumbnail;

    if (thumbnail) {
      const { keyName, bucketName } = this.s3Service.getLocationFromUrl(thumbnail);

      const newKeyName = `proposal_${keyName}`;

      await this.s3Service.copySource(bucketName, keyName, bucketName, newKeyName, 'public-read');

      model.detailedProposal.systemDesignData.thumbnail = this.s3Service.buildUrlFromKey(bucketName, newKeyName);
    }

    if (proposalTemplate) {
      model.detailedProposal.proposalTemplateSnapshot = proposalTemplate;
    }

    // Generate PDF and HTML file then get File Url
    const infoProposalAfterInsert = await model.save();
    const token = this.jwtService.sign(
      {
        proposalId: infoProposalAfterInsert._id,
        isAgent: true,
        user: { userEmails: [proposalDto.detailedProposal.recipients[0].email] },
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

    // create new ProposalAnalytic
    const newProposalAnalytic = new this.proposalAnalyticModel({
      proposalId: infoProposalAfterInsert.id,
      viewBy: 'agent',
    });
    await newProposalAnalytic.save();

    const isSent = await this.checkIsSent(infoProposalAfterInsert);

    return OperationResult.ok(strictPlainToClass(ProposalDto, { ...infoProposalAfterInsert.toJSON(), isSent }));
  }

  async update(id: ObjectId, proposalDto: UpdateProposalDto): Promise<OperationResult<ProposalDto>> {
    const foundProposal = await this.proposalModel.findById(id);

    if (!foundProposal) {
      throw ApplicationException.EntityNotFound(id.toString());
    }

    const filteredPayload = pickBy(proposalDto, x => x !== undefined);

    Object.keys(filteredPayload).forEach(key => {
      foundProposal.detailedProposal[key] = filteredPayload[key];
    });

    if (filteredPayload.isArchived !== undefined) {
      foundProposal.isArchived = filteredPayload.isArchived;
    }

    await foundProposal.save();

    const isSent = await this.checkIsSent(foundProposal);

    return OperationResult.ok(strictPlainToClass(ProposalDto, { ...foundProposal.toJSON(), isSent }));
  }

  async getList(
    limit: number,
    skip: number,
    quoteId: string,
    opportunityId: string,
    status: PROPOSAL_FILTER_STATUS,
  ): Promise<OperationResult<Pagination<ProposalDto>>> {
    let isArchived;
    switch (status) {
      case PROPOSAL_FILTER_STATUS.ACTIVE:
        isArchived = { $ne: true };
        break;
      case PROPOSAL_FILTER_STATUS.ARCHIVED:
        isArchived = true;
        break;
      default:
        // get all
        isArchived = undefined;
        break;
    }

    const condition = omitBy(
      {
        quoteId,
        opportunityId,
        isArchived,
      },
      isNil,
    );

    const [proposals, total] = await Promise.all([
      this.proposalModel.find(condition).limit(limit).skip(skip).lean(),
      this.proposalModel.countDocuments(condition),
    ]);

    const checkedProposals = await Promise.all(
      proposals.map(async proposal => {
        const isSent = await this.checkIsSent(proposal);
        return { ...proposal, isSent };
      }),
    );

    return OperationResult.ok({
      data: strictPlainToClass(ProposalDto, checkedProposals),
      total,
    });
  }

  async getProposalDetails(id: ObjectId): Promise<OperationResult<ProposalDto>> {
    const proposal = await this.proposalModel.findById(id).lean();
    if (!proposal) {
      throw ApplicationException.EntityNotFound(id.toString());
    }

    const requiredData = await this.getProposalRequiredData(proposal);

    const isSent = await this.checkIsSent(proposal);

    return OperationResult.ok(
      strictPlainToClass(ProposalDto, {
        ...proposal,
        ...requiredData,
        isSent,
      }),
    );
  }

  async generateLinkByAgent(
    proposalId: string,
    user: ILoggedInUser,
  ): Promise<OperationResult<{ proposalLink: string }>> {
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
        user: { userEmails: [user.userEmails[0].address] },
      },
      {
        expiresIn: '1d',
        secret: process.env.PROPOSAL_JWT_SECRET,
      },
    );

    return OperationResult.ok({ proposalLink: (process.env.PROPOSAL_URL || '').concat(`/?s=${token}`) });
  }

  async sendRecipients(proposalId: ObjectId, recipientEmails: string[]): Promise<OperationResult<ProposalDto>> {
    const foundProposal = await this.proposalModel.findById(proposalId);
    if (!foundProposal) {
      throw ApplicationException.EntityNotFound(proposalId.toString());
    }

    const opportunity = await this.opportunityService.getDetailById(foundProposal.opportunityId);

    if (!opportunity) {
      throw ApplicationException.EntityNotFound(foundProposal.opportunityId);
    }

    const assignedMember = await this.userService.getUserById(opportunity.assignedMember);

    if (!assignedMember) {
      throw ApplicationException.EntityNotFound(opportunity.assignedMember);
    }

    const sendRecipients = recipientEmails.map(email => {
      const foundRecipient = foundProposal.detailedProposal.recipients.find(recipient => recipient.email === email);
      if (foundRecipient) {
        return foundRecipient;
      }
      return {
        // for case send to me
        email,
        firstName: email.split('@')?.[0] ? email.split('@')[0] : 'Customer',
      };
    });

    const tokensByRecipients = sendRecipients.map(item =>
      this.jwtService.sign(
        {
          proposalId: foundProposal._id,
          user: { userEmails: [item.email] },
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

    // update analytic send
    const foundAnalytic = await this.proposalAnalyticModel.findOne({
      proposalId: proposalId.toString(),
    });
    const currentDate = new Date();
    if (!foundAnalytic) {
      const dataToSave = {
        tracking: recipientEmails.map(email => ({ by: email, at: currentDate, type: TRACKING_TYPE.SENT })),
      };
      const newProposalAnalytic = new this.proposalAnalyticModel({
        proposalId,
        viewBy: 'agent',
        ...dataToSave,
      });
      await newProposalAnalytic.save();
    } else {
      recipientEmails.forEach(email => {
        foundAnalytic.tracking.push({ by: email, at: currentDate, type: TRACKING_TYPE.SENT });
      });
      await foundAnalytic.save();
    }

    sendRecipients.forEach((recipient, index) => {
      const recipientsExcludeSelf = sendRecipients
        .reduce((previousValue, currentValue) => {
          if (recipient.email !== currentValue.email) {
            previousValue.push(currentValue.email || '');
          }
          return previousValue;
        }, [] as string[])
        .join(', ');
      const customerName = [recipient?.firstName, recipient?.lastName]?.filter(i => !!i).join(' ');

      const replyTo = {
        fullName: `${assignedMember.profile.firstName} ${assignedMember.profile.lastName}`,
        email: assignedMember.emails[0].address,
      };

      const data = {
        contactFullName: customerName !== '' ? customerName : 'Customer',
        proposalValidityPeriod: foundProposal.detailedProposal.proposalValidityPeriod,
        recipientNotice: recipientsExcludeSelf
          ? `Please note, this proposal has been shared with additional email IDs as per your request: ${recipientsExcludeSelf}`
          : '',
        link: linksByToken[index],
        salesAgentFullName: replyTo.fullName,
        salesAgentEmail: replyTo.email,
        salesAgentPhoneNumber: assignedMember.profile.cellPhone,
      };

      this.emailService
        .sendMailByTemplate(
          recipient?.email || '',
          `${foundProposal.detailedProposal.proposalName}`,
          'Proposal Email',
          data,
          replyTo,
        )
        .catch(error => console.error(error));
    });

    const isSent = await this.checkIsSent(foundProposal);

    return OperationResult.ok(strictPlainToClass(ProposalDto, { ...foundProposal.toJSON(), isSent }));
  }

  async verifyProposalToken(
    data: ValidateProposalDto,
  ): Promise<
    OperationResult<{
      isAgent: boolean;
      utility?: LeanDocument<UtilityUsageDetails> | null;
      historicalUsage?: IHistoricalUsage;
      systemProduction?: SystemProductionDto;
      manufacturers?: ManufacturerDto[];
      tariffDetails?: { masterTariff: GenabilityTariffDataDetail; postInstallMasterTariff: GenabilityTariffDataDetail };
      proposalDetail: ProposalDto;
      sumOfUtilityUsageCost?: number;
      sumOfMonthlyUsageCost?: number;
      solarProduction?: IEnergyProfileProduction;
      batteryDischargingSeries?: IBatteryDataSeries;
      batteryChargingSeries?: IBatteryDataSeries;
      existingSystemProduction?: IEnergyProfileProduction;
      netLoad?: INetLoad;
      proposalView?: PROPOSAL_VIEW_MODE;
      proposalPeriod?: PROPOSAL_PERIOD_MODE;
      proposalMonthIndex?: number;
    }>
  > {
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

    const {
      user: { userEmails },
    } = tokenPayload;

    const { proposalView, proposalPeriod, proposalMonthIndex } = proposal;

    const foundAnalyticTemp = this.proposalAnalyticModel.findOne({ proposalId: tokenPayload.proposalId });
    const getNetLoadAverageTemp = this.energyProfileService.getNetLoadAverage(proposal.systemDesignId);

    // need to upgrade typescript to version 4.5 to allow over 10 elements in Promise.all
    const [
      existingSystemProduction,
      utility,
      expectedUsage,
      requiredData,
      manufacturersRes,
      systemProductionRes,
      solarProduction,
      batteryChargingSeries,
      batteryDischargingSeries,
      batteryDataSeriesForTypicalDay,
    ] = await Promise.all([
      this.energyProfileService.getExistingSystemProductionSeries(proposal.opportunityId),
      this.utilityService.getUtilityByOpportunityId(proposal.opportunityId),
      this.energyProfileService.getExpectedUsage(proposal.opportunityId),
      this.getProposalRequiredData(proposal),
      this.manufacturerService.getList(),
      this.systemProductionService.findById(proposal.detailedProposal.systemDesignData.systemProductionId),
      this.energyProfileService.getSunroofHourlyProduction(proposal.systemDesignId),
      this.energyProfileService.getBatteryChargingSeries(proposal.systemDesignId),
      this.energyProfileService.getBatteryDischargingSeries(proposal.systemDesignId),
      this.energyProfileService.getBatteryDataSeriesForTypicalDay(proposal.systemDesignId),
    ]);
    const foundAnalytic = await foundAnalyticTemp;
    const netLoadAverage = await getNetLoadAverageTemp;

    const opportunity = await this.opportunityService.getDetailById(proposal.opportunityId);
    if (!opportunity) {
      throw ApplicationException.EntityNotFound(`OpportunityId: ${proposal.opportunityId}`);
    }
    const partnerAccountPhoto = await this.accountPhotoService.getAccountPhotoByQuery({
      accountId: opportunity.accountId, 
      type: 'logo',
    }, {
      _id: opportunity.accountId, 
      name: {
        $not: /swell/i
      }
    });

    const netLoad: INetLoad = {
      average: netLoadAverage,
      typical: getNetLoadTypical(
        expectedUsage,
        solarProduction,
        batteryDataSeriesForTypicalDay.batteryChargingSeries,
        batteryDataSeriesForTypicalDay.batteryDischargingSeries,
      ),
    };
    // update analytic proposalView
    const currentDate = new Date();
    if (foundAnalytic) {
      userEmails.forEach(email => {
        foundAnalytic.tracking.push({ by: email, at: currentDate, type: TRACKING_TYPE.VIEWED });
      });
      await foundAnalytic.save();
    }

    // get utility tariffDetails
    let tariffDetails;
    if (utility?.utilityData && utility?.costData) {
      const {
        costData: { masterTariffId, postInstallMasterTariffId },
        utilityData: {
          loadServingEntityData: { zipCode, lseId },
        },
      } = utility;
      const tariffsRes = await this.utilityService.getTariffs(zipCode, Number(lseId));

      tariffDetails = {
        masterTariff: tariffsRes.data?.tariffDetails.find(
          tariff => tariff.masterTariffId.toString() === masterTariffId,
        ),
        postInstallMasterTariff: tariffsRes.data?.tariffDetails.find(
          tariff => tariff.masterTariffId.toString() === postInstallMasterTariffId,
        ),
      };
    }

    // TODO: remove start
    const storages = proposal.detailedProposal.systemDesignData.roofTopDesignData.storage;
    let manufacturer: LeanDocument<Manufacturer> = {
      name: '',
    };
    if (storages.length) {
      manufacturer = await this.manufacturerService.getOneById(
        storages[0].storageModelDataSnapshot.manufacturerId || '',
      );
      storages.map(item => {
        item.storageModelDataSnapshot.manufacturer = manufacturer.name;
        return item;
      });
    }

    const inverters = proposal.detailedProposal.systemDesignData.roofTopDesignData.inverters;
    if (inverters.length) {
      manufacturer = await this.manufacturerService.getOneById(
        inverters[0].inverterModelDataSnapshot.manufacturerId || '',
      );
      inverters.map(item => {
        item.inverterModelDataSnapshot.manufacturer = manufacturer.name;
        return item;
      });
    }

    const sumOfUtilityUsageCost =
      utility?.costData.plannedCost?.annualCost ??
      utility?.costData.computedCost.annualCost ??
      (utility?.costData.computedCost.cost?.reduce(
        (previousValue, currentValue) => previousValue + currentValue.v,
        0,
      ) ||
        0);

    const sumOfMonthlyUsageCost =
      utility?.utilityData.plannedProfile?.annualUsage ??
      (utility?.utilityData?.computedUsage?.monthlyUsage?.reduce(
        (previousValue, currentValue) => previousValue + currentValue.v,
        0,
      ) ||
        0);
    // TODO: remove end

    const isSent = await this.checkIsSent(proposal);
    
    const proposalDetail = strictPlainToClass(ProposalDto, { ...proposal, ...requiredData, partnerAccount: {imgUrl: partnerAccountPhoto?.imgUrl}, isSent });
    
    // add props systemProductionData to systemDesignData
    if (systemProductionRes?.data) {
      proposalDetail.systemDesignData.systemProductionData = systemProductionRes?.data;
    }
    return OperationResult.ok({
      isAgent: !!tokenPayload.isAgent,
      utility,
      expectedUsage,
      manufacturers: manufacturersRes?.data?.data,
      tariffDetails,
      proposalDetail,
      sumOfUtilityUsageCost,
      sumOfMonthlyUsageCost,
      solarProduction,
      batteryChargingSeries: {
        average: batteryChargingSeries,
        typical: batteryDataSeriesForTypicalDay.batteryChargingSeries,
      },
      batteryDischargingSeries: {
        average: batteryDischargingSeries,
        typical: batteryDataSeriesForTypicalDay.batteryDischargingSeries,
      },
      existingSystemProduction,
      netLoad,
      proposalView,
      proposalPeriod,
      proposalMonthIndex,
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

  async getProposalAnalyticByProposalId(proposalId: ObjectId): Promise<OperationResult<ProposalAnalyticDto>> {
    const foundProposalAnalytic = await this.proposalAnalyticModel.findOne({ proposalId: proposalId.toString() });

    if (!foundProposalAnalytic) {
      throw ApplicationException.EntityNotFound(proposalId.toString());
    }

    return OperationResult.ok(strictPlainToClass(ProposalAnalyticDto, foundProposalAnalytic.toJSON()));
  }

  async saveProposalAnalytic(analyticInfo: SaveProposalAnalyticDto): Promise<OperationResult<boolean>> {
    const { proposalId, type, viewBy, token } = analyticInfo;

    let parsedPayload;
    try {
      parsedPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.PROPOSAL_JWT_SECRET,
        ignoreExpiration: false,
      });
    } catch (error) {
      throw new UnauthorizedException();
    }

    const {
      user: { userEmails },
    } = parsedPayload;

    const foundProposal = await this.proposalModel.exists({ _id: proposalId });
    if (!foundProposal) {
      throw ApplicationException.EntityNotFound(proposalId);
    }

    const foundAnalytic = await this.proposalAnalyticModel.findOne({ proposalId, viewBy });

    const currentDate = new Date();
    if (!foundAnalytic) {
      const dataToSave =
        type === PROPOSAL_ANALYTIC_TYPE.DOWNLOAD
          ? { tracking: userEmails.map(email => ({ by: email, at: currentDate, type: TRACKING_TYPE.DOWNLOADED })) }
          : { tracking: userEmails.map(email => ({ by: email, at: currentDate, type: TRACKING_TYPE.VIEWED })) };

      const newProposalAnalytic = new this.proposalAnalyticModel({
        proposalId,
        viewBy,
        ...dataToSave,
      });
      await newProposalAnalytic.save();

      return OperationResult.ok(true);
    }

    if (type === PROPOSAL_ANALYTIC_TYPE.DOWNLOAD) {
      userEmails.forEach(email => {
        foundAnalytic.tracking.push({ by: email, at: currentDate, type: TRACKING_TYPE.DOWNLOADED });
      });
    } else {
      userEmails.forEach(email => {
        foundAnalytic.tracking.push({ by: email, at: currentDate, type: TRACKING_TYPE.VIEWED });
      });
    }

    await foundAnalytic.save();
    return OperationResult.ok(true);
  }

  async getPreSignedObjectUrl(
    fileName: string,
    fileType: string,
    token: string,
    isSolarQuoteTool: boolean,
    isGetDownloadLink: boolean,
    isProposal?: boolean,
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
      rootDir: !!isProposal,
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
  ): Promise<OperationResult<ProposalDto>> {
    const proposal = await this.proposalModel.findById(proposalId);

    if (!proposal) throw ApplicationException.EntityNotFound(`ProposalId: ${proposalId}`);

    const quote = await this.quoteService.getOneById(proposal.quoteId);

    if (!quote) {
      throw new NotFoundException(`No quote found with id ${proposal.quoteId}`);
    }

    const opportunity = await this.opportunityService.getDetailById(proposal.opportunityId);
    if (!opportunity) {
      throw ApplicationException.EntityNotFound(`OpportunityId: ${proposal.opportunityId}`);
    }

    const [contact, recordOwner, property] = await Promise.all([
      this.contactService.getContactById(opportunity.contactId),
      this.userService.getUserById(opportunity.recordOwner),
      this.propertyService.findPropertyById(opportunity.propertyId),
    ]);

    const fundingSourceType = proposal.detailedProposal.quoteData.quoteFinanceProduct.financeProduct.productType;

    const [customerPayment, utilityName, roofTopDesign, systemDesign] = await Promise.all([
      this.customerPaymentService.calculateContractCustomPayment('', proposal.opportunityId, quote),
      this.utilityService.getUtilityName(opportunity.utilityId),
      this.systemDesignService.getRoofTopDesignById(proposal.systemDesignId),
      this.systemDesignService.getOneById(proposal.systemDesignId, true),
    ]);

    const assignedMember = await this.userService.getUserById(opportunity.assignedMember);

    // Get gsProgram
    const gsProgram = quote.quoteFinanceProduct.incentiveDetails[0]?.detail?.gsProgramSnapshot;

    // Get utilityProgramMaster
    const utilityProgramMaster = quote.utilityProgram?.utilityProgramId
      ? await this.utilityProgramMasterService.getLeanById(quote.utilityProgram.utilityProgramId)
      : null;

    const leaseSolverConfig =
      (quote.quoteFinanceProduct.financeProduct.productAttribute as ILeaseProductAttributes)
        .leaseSolverConfigSnapshot || null;

    const sampleContact = {
      ...contact,
      firstName: 'Sample',
      lastName: 'Contract',
    };

    // add props systemProductionData to systemDesign
    if (systemDesign) {
      const systemProduction = await this.systemProductionService.findById(systemDesign.systemProductionId);
      if (systemProduction?.data) {
        systemDesign.systemProductionData = systemProduction.data;
      }
    }
    const genericObject: IGenericObject = {
      signerDetails,
      opportunity,
      quote,
      recordOwner: recordOwner || ({} as any),
      contact: sampleContact as any,
      property: property as any,
      customerPayment: customerPayment || ({} as any),
      utilityName: utilityName?.split(' - ')[1] || 'none',
      roofTopDesign: roofTopDesign || ({} as any),
      isCash: fundingSourceType === 'cash',
      assignedMember,
      gsProgram,
      utilityProgramMaster,
      leaseSolverConfig,
      financialProduct: quote.quoteFinanceProduct.financeProduct.financialProductSnapshot,
      contract: {} as any,
      systemDesign: systemDesign!,
    };

    const compositeTemplateIds = uniq(templateDetails.map(e => e.compositeTemplateId));

    const compositeTemplates = await Promise.all(
      compositeTemplateIds.map(async e => this.docusignTemplateMasterService.getTemplateIdsInCompositeTemplate(e)),
    );

    const templateDetailsData = await Promise.all(
      templateDetails.map(async ({ id, compositeTemplateId }) => {
        const found = await this.docusignTemplateMasterService.getTemplateMasterById(id);

        if (found && compositeTemplates.find(e => e.id === compositeTemplateId && e.templates.includes(id))) {
          return found;
        }
        throw new NotFoundException(`No template found with id ${id} in composite template ${compositeTemplateId}`);
      }),
    );

    const docusignResponse = await this.docusignCommunicationService.sendContractToDocusign(
      proposal._id.toString(),
      templateDetailsData,
      signerDetails,
      genericObject,
      compositeTemplates.find(e => e.templates.includes(templateDetailsData[0].id.toString()))
        ?.beginPageNumberingTemplateId ?? '',
      true,
    );

    if (docusignResponse.status === 'SUCCESS') {
      proposal.detailedProposal.envelopeId = docusignResponse.contractingSystemReferenceId;
      await proposal.save();
    }

    const document = await this.docusignCommunicationService.downloadContract(
      docusignResponse.contractingSystemReferenceId as string,
      true,
    );

    const fileName = `${contact?.lastName || ''}, ${contact?.firstName || ''} - Sample ${
      compositeTemplates.find(e => e.templates.includes(templateDetailsData[0].id.toString()))?.filenameForDownloads ||
      ''
    } - Not Executable.pdf`;

    try {
      const s3UploadResult = await this.saveToStorage(document, fileName, proposal._id.toString());
      const currentSampleContractUrl =
        proposal.detailedProposal.sampleContractUrl &&
        proposal.detailedProposal.sampleContractUrl.length > 0 &&
        proposal.detailedProposal.sampleContractUrl[0].sampleContractUrl !== undefined
          ? proposal.detailedProposal.sampleContractUrl
          : [];
      if (!currentSampleContractUrl.find(item => item.compositeTemplateId === compositeTemplateIds[0])) {
        currentSampleContractUrl.push({
          sampleContractUrl: s3UploadResult.Location,
          compositeTemplateId: compositeTemplateIds[0],
        });
      }

      proposal.detailedProposal.sampleContractUrl = currentSampleContractUrl;
      await proposal.save();

      const isSent = await this.checkIsSent(proposal);

      return OperationResult.ok(strictPlainToClass(ProposalDto, { ...proposal.toJSON(), isSent }));
    } catch (err) {
      // TODO use Logger
      console.error('s3 upload error', err);
      throw ApplicationException.ServiceError();
    }
  }

  public async existByQuoteId(quoteId: string): Promise<false | { (name: string): string }> {
    const doc = await this.proposalModel.find({ quoteId }, { _id: 1, 'detailed_proposal.proposal_name': 1 }).limit(1);

    if (doc.length) {
      return name =>
        `${name} is being used in the proposal named ${
          doc[0].detailedProposal.proposalName
        } (id: ${doc[0]._id.toString()})`;
    }
    return false;
  }

  public async existBySystemDesignId(systemDesignId: string): Promise<false | { (name: string): string }> {
    const doc = await this.proposalModel
      .find({ systemDesignId }, { _id: 1, 'detailed_proposal.proposal_name': 1 })
      .limit(1);

    if (doc.length) {
      return name =>
        `${name} is being used in the proposal named ${
          doc[0].detailedProposal.proposalName
        } (id: ${doc[0]._id.toString()})`;
    }
    return false;
  }

  private saveToStorage(
    doc: IncomingMessage,
    fileName: string,
    rootDir: boolean | string = true,
  ): Promise<ManagedUpload.SendData> {
    return new Promise((resolve, reject) => {
      doc.pipe(
        this.s3Service.putStream(fileName, this.BUCKET_NAME, 'application/pdf', '', rootDir, (err, data) => {
          if (err) {
            return reject(err);
          }

          return resolve(data);
        }),
      );
    });
  }

  public async deleteProposal(proposalId: ObjectId): Promise<void> {
    const found = await this.proposalModel.findOne({ _id: proposalId });

    if (!found) {
      throw new NotFoundException(`No proposal found with id ${proposalId.toString()}`);
    }

    await found.delete();
  }

  async checkIsSent(proposal: LeanDocument<Proposal>): Promise<boolean> {
    const foundProposalAnalytic = await this.proposalAnalyticModel.findOne({ proposalId: proposal._id.toString() });

    if (!foundProposalAnalytic) return false;

    for (let i = 0; i < foundProposalAnalytic.tracking.length; i++) {
      const trackingInfo = foundProposalAnalytic.tracking[i];
      const isSentToRecipient = proposal.detailedProposal.recipients.find(
        recipient => recipient.email === trackingInfo.by,
      );
      if (isSentToRecipient) return true;
    }

    return false;
  }

  public async getProposalsBySystemDesignId(systemDesignId: string): Promise<Proposal[]> {
    return this.proposalModel.find({ systemDesignId });
  }
}
