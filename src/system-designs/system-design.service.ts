import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { flatten, pickBy, sumBy } from 'lodash';
import { LeanDocument, Model, Types } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination } from 'src/app/common';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { QuotePartnerConfigService } from 'src/quote-partner-configs/quote-partner-config.service';
import { QuoteService } from 'src/quotes/quote.service';
import { AdderConfigService } from '../adder-config/adder-config.service';
import { ProductService } from '../products/product.service';
import { CALCULATION_MODE } from '../utilities/constants';
import { UtilityService } from '../utilities/utility.service';
import { COST_UNIT_TYPE, DESIGN_MODE, FINANCE_TYPE_EXISTING_SOLAR } from './constants';
import {
  CreateSystemDesignDto,
  ExistingSolarDataDto,
  GetInverterClippingDetailDto,
  UpdateAncillaryMasterDtoReq,
  UpdateSystemDesignDto,
} from './req';
import { GetInverterClippingDetailResDto, SystemDesignAncillaryMasterDto, SystemDesignDto } from './res';
import { SystemDesignAncillaryMaster, SYSTEM_DESIGN_ANCILLARY_MASTER } from './schemas';
import { SystemProductService, UploadImageService } from './sub-services';
import { IRoofTopSchema, SystemDesign, SystemDesignModel, SYSTEM_DESIGN } from './system-design.schema';

@Injectable()
export class SystemDesignService {
  constructor(
    @InjectModel(SYSTEM_DESIGN) private readonly systemDesignModel: Model<SystemDesign>,
    @InjectModel(SYSTEM_DESIGN_ANCILLARY_MASTER)
    private readonly ancillaryMasterModel: Model<SystemDesignAncillaryMaster>,
    private readonly productService: ProductService,
    private readonly systemProductService: SystemProductService,
    private readonly uploadImageService: UploadImageService,
    @Inject(forwardRef(() => UtilityService))
    private readonly utilityService: UtilityService,
    private readonly adderConfigService: AdderConfigService,
    @Inject(forwardRef(() => QuoteService))
    private readonly quoteService: QuoteService,
    private readonly quotePartnerConfigService: QuotePartnerConfigService,
    @Inject(forwardRef(() => OpportunityService))
    private readonly opportunityService: OpportunityService,
  ) {}

  async create(systemDesignDto: CreateSystemDesignDto): Promise<OperationResult<SystemDesignDto>> {
    if (!systemDesignDto.roofTopDesignData && !systemDesignDto.capacityProductionDesignData) {
      throw new Error('Please put your data in body');
    }

    if (!systemDesignDto.isRetrofit && !systemDesignDto.roofTopDesignData.panelArray.length) {
      throw ApplicationException.ValidationFailed('Panel Array');
    }

    const systemDesign = new SystemDesignModel(systemDesignDto);
    const [utilityAndUsage, systemProductionArray] = await Promise.all([
      this.utilityService.getUtilityByOpportunityId(systemDesignDto.opportunityId),
      this.systemProductService.calculateSystemProductionByHour(systemDesignDto),
    ]);

    this.handleUpdateExistingSolar(
      systemDesignDto.opportunityId,
      systemDesignDto.isRetrofit,
      systemDesignDto.existingSolarData,
    );

    if (systemDesign.design_mode === DESIGN_MODE.ROOF_TOP) {
      let cumulativeGenerationKWh = 0;
      let cumulativeCapacityKW = 0;

      const [thumbnail] = await Promise.all(
        flatten([
          this.uploadImageService.uploadToAWSS3(systemDesignDto.thumbnail) as any,
          systemDesign.roof_top_design_data.panel_array.map(async (item, index) => {
            item.array_id = Types.ObjectId();
            const { panelModelId } = systemDesignDto.roofTopDesignData.panelArray[index];
            item.panel_model_id = panelModelId;
            const panelModelData = await this.productService.getDetailById(panelModelId);
            const data = { ...panelModelData, part_number: panelModelData?.partNumber } as any;
            systemDesign.setPanelModelDataSnapshot(data, index);
            const capacity = (item.number_of_panels * (panelModelData?.sizeW ?? 0)) / 1000;
            const acAnnual = await this.systemProductService.pvWatCalculation({
              lat: systemDesign.latitude,
              lon: systemDesign.longtitude,
              azimuth: item.azimuth,
              systemCapacity: capacity,
              tilt: item.pitch,
              losses: item.shading_percentage,
            });
            cumulativeGenerationKWh += acAnnual;
            cumulativeCapacityKW += capacity;
          }),
          systemDesign.roof_top_design_data.adders.map(async (item, index) => {
            const adder = await this.adderConfigService.getAdderConfigDetail(item.adder_id);
            systemDesign.setAdder(
              { ...adder, modified_at: adder?.modifiedAt } as any,
              this.convertIncrementAdder((adder as any)?.increment as string),
              index,
            );
          }),
          systemDesign.roof_top_design_data.inverters.map(async (inverter, index) => {
            const inverterModelData = await this.productService.getDetailById(inverter.inverter_model_id);
            const data = { ...inverterModelData, part_number: inverterModelData?.partNumber } as any;
            systemDesign.setInverter(data, index);
          }),
          systemDesign.roof_top_design_data.storage.map(async (storage, index) => {
            const storageModelData = await this.productService.getDetailById(storage.storage_model_id);
            const data = { ...storageModelData, part_number: storageModelData?.partNumber } as any;
            systemDesign.setStorage(data, index);
          }),
          systemDesign.roof_top_design_data.balance_of_systems.map(async (balanceOfSystem, index) => {
            const balanceOfSystemModelData = await this.productService.getDetailById(
              balanceOfSystem.balance_of_system_id,
            );
            const data = {
              ...balanceOfSystemModelData,
              part_number: balanceOfSystemModelData?.partNumber,
            } as any;
            systemDesign.setBalanceOfSystem(data, index);
          }),
          systemDesign.roof_top_design_data.ancillary_equipments.map(async (ancillary, index) => {
            const ancillaryModelData = await this.ancillaryMasterModel.findById(ancillary.ancillary_id).lean();
            const data = { ...ancillaryModelData, ancillary_id: ancillary.ancillary_id } as any;
            systemDesign.setAncillaryEquipment(data, index);
          }),
        ]),
      );

      systemDesign.setThumbnail(thumbnail);
      // systemDesign.setIsSelected(systemDesignDto.isSelected);

      const annualUsageKWh = utilityAndUsage?.utility_data.actual_usage?.annual_consumption || 0;

      systemDesign.setSystemProductionData({
        capacityKW: cumulativeCapacityKW,
        generationKWh: cumulativeGenerationKWh,
        productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
        annual_usageKWh: annualUsageKWh,
        offset_percentage: annualUsageKWh > 0 ? cumulativeGenerationKWh / annualUsageKWh : 0,
        generationMonthlyKWh: systemProductionArray.monthly,
      });
    }

    const netUsagePostInstallation = this.systemProductService.calculateNetUsagePostSystemInstallation(
      (utilityAndUsage?.utility_data?.actual_usage?.hourly_usage || []).map(item => item.v),
      systemProductionArray.hourly,
    );

    const costPostInstallation = await this.utilityService.calculateCost(
      netUsagePostInstallation.hourly_net_usage,
      utilityAndUsage?.cost_data?.master_tariff_id || '',
      CALCULATION_MODE.TYPICAL,
      new Date().getFullYear(),
      utilityAndUsage?.utility_data?.typical_baseline_usage?.zip_code,
    );

    systemDesign.setNetUsagePostInstallation(netUsagePostInstallation);
    systemDesign.setCostPostInstallation(costPostInstallation);

    const createdSystemDesign = new this.systemDesignModel(systemDesign);
    await createdSystemDesign.save();

    return OperationResult.ok(new SystemDesignDto(createdSystemDesign.toObject()));
  }

  async update(id: string, systemDesignDto: UpdateSystemDesignDto): Promise<OperationResult<SystemDesignDto>> {
    if (typeof systemDesignDto.isRetrofit !== 'undefined') {
      if (!systemDesignDto.isRetrofit && !systemDesignDto.roofTopDesignData?.panelArray?.length) {
        throw ApplicationException.ValidationFailed('Panel Array');
      }
    }

    const foundSystemDesign = await this.systemDesignModel.findById(id);

    if (!foundSystemDesign) {
      throw ApplicationException.EntityNotFound(id);
    }

    const systemDesign = new SystemDesignModel(pickBy(systemDesignDto, item => typeof item !== 'undefined') as any);

    if (systemDesignDto.name) {
      systemDesign.name = systemDesignDto.name;
    }

    // if (systemDesignDto.isSelected) {
    //   systemDesign.setIsSelected(systemDesignDto.isSelected);
    // }

    if (systemDesignDto.isSolar) {
      systemDesign.setIsSolar(systemDesignDto.isSolar);
    }

    this.handleUpdateExistingSolar(
      systemDesignDto.opportunityId,
      systemDesignDto.isRetrofit,
      systemDesignDto.existingSolarData,
    );

    if (systemDesignDto.isRetrofit) {
      systemDesign.setIsRetrofit(systemDesignDto.isRetrofit);
    }

    if (systemDesign.design_mode === DESIGN_MODE.ROOF_TOP) {
      let cumulativeGenerationKWh = 0;
      let cumulativeCapacityKW = 0;

      if (systemDesignDto.thumbnail) {
        const [thumbnail] = await Promise.all([
          this.uploadImageService.uploadToAWSS3(systemDesignDto.thumbnail),
          this.uploadImageService.deleteFileS3(foundSystemDesign.thumbnail),
        ]);
        systemDesign.setThumbnail(thumbnail);
      }

      if (systemDesignDto.roofTopDesignData) {
        const [utilityAndUsage, systemProductionArray] = await Promise.all([
          this.utilityService.getUtilityByOpportunityId(systemDesignDto.opportunityId),
          this.systemProductService.calculateSystemProductionByHour(systemDesignDto),
        ]);

        await Promise.all(
          flatten([
            systemDesign.roof_top_design_data.panel_array.map(async (item, index) => {
              item.array_id = Types.ObjectId();
              const { panelModelId } = systemDesignDto.roofTopDesignData.panelArray[index];
              item.panel_model_id = panelModelId;
              const panelModelData = await this.productService.getDetailById(panelModelId);
              const data = { ...panelModelData, part_number: panelModelData?.partNumber } as any;
              systemDesign.setPanelModelDataSnapshot(data, index);
              const capacity = (item.number_of_panels * (panelModelData?.sizeW ?? 0)) / 1000;
              const acAnnual = await this.systemProductService.pvWatCalculation({
                lat: systemDesign.latitude,
                lon: systemDesign.longtitude,
                azimuth: item.azimuth,
                systemCapacity: capacity,
                tilt: item.pitch,
                losses: item.shading_percentage,
              });
              cumulativeGenerationKWh += acAnnual;
              cumulativeCapacityKW += capacity;
            }),
            systemDesign.roof_top_design_data.adders.map(async (item, index) => {
              const adder = await this.adderConfigService.getAdderConfigDetail(item.adder_id);
              systemDesign.setAdder(
                { ...adder, modified_at: adder?.modifiedAt } as any,
                this.convertIncrementAdder((adder as any)?.increment as string),
                index,
              );
            }),
            systemDesign.roof_top_design_data.inverters.map(async (inverter, index) => {
              const inverterModelData = await this.productService.getDetailById(inverter.inverter_model_id);
              const data = { ...inverterModelData, part_number: inverterModelData?.partNumber } as any;
              systemDesign.setInverter(data, index);
            }),
            systemDesign.roof_top_design_data.storage.map(async (storage, index) => {
              const storageModelData = await this.productService.getDetailById(storage.storage_model_id);
              const data = { ...storageModelData, part_number: storageModelData?.partNumber } as any;
              systemDesign.setStorage(data, index);
            }),
            systemDesign.roof_top_design_data.balance_of_systems.map(async (balanceOfSystem, index) => {
              const balanceOfSystemModelData = await this.productService.getDetailById(
                balanceOfSystem.balance_of_system_id,
              );
              const data = {
                ...balanceOfSystemModelData,
                part_number: balanceOfSystemModelData?.partNumber,
              } as any;
              systemDesign.setBalanceOfSystem(data, index);
            }),
            systemDesign.roof_top_design_data.ancillary_equipments.map(async (ancillary, index) => {
              const ancillaryModelData = await this.ancillaryMasterModel.findById(ancillary.ancillary_id).lean();
              systemDesign.setAncillaryEquipment(ancillaryModelData as any, index);
            }),
          ]),
        );

        const annualUsageKWh = utilityAndUsage?.utility_data.typical_baseline_usage?.annual_consumption || 0;

        systemDesign.setSystemProductionData({
          capacityKW: cumulativeCapacityKW,
          generationKWh: cumulativeGenerationKWh,
          productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
          annual_usageKWh: annualUsageKWh,
          offset_percentage: annualUsageKWh > 0 ? cumulativeGenerationKWh / annualUsageKWh : 0,
          generationMonthlyKWh: systemProductionArray.monthly,
        });

        const netUsagePostInstallation = this.systemProductService.calculateNetUsagePostSystemInstallation(
          (utilityAndUsage?.utility_data.actual_usage.hourly_usage || []).map(item => item.v),
          systemProductionArray.hourly,
        );

        const costPostInstallation = await this.utilityService.calculateCost(
          netUsagePostInstallation.hourly_net_usage,
          utilityAndUsage?.cost_data.master_tariff_id ?? '',
          CALCULATION_MODE.TYPICAL,
          new Date().getFullYear(),
          utilityAndUsage?.utility_data.typical_baseline_usage.zip_code,
        );

        systemDesign.setNetUsagePostInstallation(netUsagePostInstallation);
        systemDesign.setCostPostInstallation(costPostInstallation);
      }
    }

    const removedUndefined = pickBy(systemDesign, item => typeof item !== 'undefined');

    await Promise.all([
      foundSystemDesign.updateOne(removedUndefined as any),
      systemDesignDto.designMode && this.quoteService.setOutdatedData(systemDesignDto.opportunityId, 'System Design'),
      // systemDesignDto.designMode <=> update all systemDesign detail
    ]);

    return OperationResult.ok(new SystemDesignDto({ ...foundSystemDesign.toObject(), ...removedUndefined } as any));
  }

  async getInverterClippingDetails(
    req: GetInverterClippingDetailDto,
  ): Promise<OperationResult<GetInverterClippingDetailResDto>> {
    const partnerConfigData = await this.quotePartnerConfigService.getDetailByPartnerId(req.partnerId);
    if (!partnerConfigData) {
      return OperationResult.ok();
    }

    const { invertersDetail, panelsDetail } = req.panelAndInverterDetail;
    const totalPvSTCRating = sumBy(panelsDetail, panel => panel.numberOfPanels * panel.panelSTCRating);
    const totalInverterRating = sumBy(
      invertersDetail,
      inverter => inverter.numberOfInverters * inverter.inverterRating,
    );

    const response = new GetInverterClippingDetailResDto(req.panelAndInverterDetail, {
      totalSTCProductionInWatt: totalPvSTCRating,
      totalInverterCapacityInWatt: totalInverterRating,
      recommendationDetail: {} as any,
    });

    if (partnerConfigData.defaultDCClipping === null || !partnerConfigData.enableModuleDCClipping) {
      response.clippingDetails.isDCClippingRestrictionEnabled = false;
      // eslint-disable-next-line consistent-return
      return OperationResult.ok(response);
    }
    response.clippingDetails.isDCClippingRestrictionEnabled = true;

    response.clippingDetails.defaultClippingRatio = partnerConfigData.defaultDCClipping;
    response.clippingDetails.maximumAllowedClippingRatio = partnerConfigData.maxModuleDCClipping;
    response.clippingDetails.currentClippingRatio = totalPvSTCRating / totalInverterRating;

    if (response.clippingDetails.currentClippingRatio <= partnerConfigData.maxModuleDCClipping) {
      response.clippingDetails.isDcToAcRatioWithinAllowedLimit = true;
    } else {
      response.clippingDetails.isDcToAcRatioWithinAllowedLimit = false;
    }

    response.clippingDetails.recommendationDetail.requiredInverterCapacityForDefaultRatio =
      totalPvSTCRating / partnerConfigData.defaultDCClipping;
    response.clippingDetails.recommendationDetail.maxClippedWattForDefaultRatio =
      totalPvSTCRating - response.clippingDetails.recommendationDetail.requiredInverterCapacityForDefaultRatio;

    response.clippingDetails.recommendationDetail.requiredInverterCapacityForMaxDefaultRatio =
      totalPvSTCRating / partnerConfigData.maxModuleDCClipping;
    response.clippingDetails.recommendationDetail.maxClippedWattForMaxRatio =
      totalPvSTCRating - response.clippingDetails.recommendationDetail.requiredInverterCapacityForMaxDefaultRatio;

    const inverterRatingInWattUsedForRecommendation = req.panelAndInverterDetail.invertersDetail[0].inverterRating;
    response.clippingDetails.recommendationDetail.recommendedInverterCountForDefaultRatioBasedOnRating = inverterRatingInWattUsedForRecommendation;
    response.clippingDetails.recommendationDetail.recommendedInverterCountForDefaultRatio =
      totalPvSTCRating / (partnerConfigData.defaultDCClipping * inverterRatingInWattUsedForRecommendation);

    return OperationResult.ok(response);
  }

  async delete(id: string, opportunityId: string): Promise<OperationResult<string>> {
    const systemDesign = await this.systemDesignModel.findOne({ _id: id, opportunity_id: opportunityId });
    if (!systemDesign) {
      throw ApplicationException.EntityNotFound(id);
    }
    await systemDesign.deleteOne();
    return OperationResult.ok('Deleted Successfully');
  }

  async getAllSystemDesigns(
    limit = 999,
    skip: number,
    opportunityId: string,
  ): Promise<OperationResult<Pagination<SystemDesignDto>>> {
    const [systemDesigns, count] = await Promise.all([
      this.systemDesignModel.find({ opportunity_id: opportunityId }).limit(limit).skip(skip).lean(),
      this.systemDesignModel.countDocuments({ opportunity_id: opportunityId }).lean(),
    ]);
    return OperationResult.ok(
      new Pagination({ data: systemDesigns.map(item => new SystemDesignDto(item)), total: count }),
    );
  }

  async getDetails(id: string): Promise<OperationResult<SystemDesignDto>> {
    const foundSystemDesign = await this.systemDesignModel.findById(id).lean();
    if (!foundSystemDesign) {
      throw ApplicationException.EntityNotFound(id);
    }
    return OperationResult.ok(new SystemDesignDto(foundSystemDesign));
  }

  async getAncillaryList(): Promise<OperationResult<Pagination<SystemDesignAncillaryMasterDto>>> {
    const res = await this.ancillaryMasterModel.find().lean();
    return OperationResult.ok(
      new Pagination({ data: res.map(item => new SystemDesignAncillaryMasterDto(item)), total: res.length }),
    );
  }

  async updateAncillaryMaster(
    id: string,
    req: UpdateAncillaryMasterDtoReq,
  ): Promise<OperationResult<SystemDesignAncillaryMasterDto>> {
    const updatedModel = await this.ancillaryMasterModel
      .findByIdAndUpdate(id, { insertion_rule: req.insertionRule }, { new: true })
      .lean();

    return OperationResult.ok(new SystemDesignAncillaryMasterDto(updatedModel || ({} as any)));
  }

  //  ->>>>>>>>>>>>>>>>>>>>>>>>> INTERNAL <<<<<<<<<<<<<<<<<<<<<<<<<<<-

  async getOneById(id: string): Promise<LeanDocument<SystemDesign> | null> {
    const systemDesign = await this.systemDesignModel.findById(id).lean();
    return systemDesign;
  }

  async getRoofTopDesignById(id: string): Promise<IRoofTopSchema | undefined> {
    const systemDesign = await this.systemDesignModel.findById(id).lean();
    return systemDesign?.roof_top_design_data;
  }

  async updateListSystemDesign(opportunityId: string, annualUsageKWh: number): Promise<boolean> {
    const systemDesigns = await this.systemDesignModel.find({ opportunity_id: opportunityId });
    try {
      await Promise.all(
        systemDesigns.map(item => {
          item.system_production_data.annual_usageKWh = annualUsageKWh;
          item.system_production_data.offset_percentage =
            annualUsageKWh > 0 ? item.system_production_data.generationKWh / annualUsageKWh : 0;
          return item.updateOne(item.toObject());
        }),
      );
    } catch (error) {
      return false;
    }

    return true;
  }

  async countByOpportunityId(opportunityId: string): Promise<number> {
    const counter = await this.systemDesignModel.countDocuments({ opportunity_id: opportunityId }).lean();
    return counter;
  }

  convertIncrementAdder(increment: string): COST_UNIT_TYPE {
    switch (increment) {
      case 'watt':
        return COST_UNIT_TYPE.PER_WATT;
      case 'foot':
        return COST_UNIT_TYPE.PER_FEET;
      case 'each':
        return COST_UNIT_TYPE.PER_EACH;
      default:
        return '' as any;
    }
  }

  async handleUpdateExistingSolar(opportunityId: string, isRetrofit: boolean, existingSolarData: ExistingSolarDataDto) {
    if (typeof isRetrofit !== 'boolean') return;

    if (isRetrofit) {
      const updateQuery = {
        $set: { ...existingSolarData, existingPV: true },
      };
      if (existingSolarData.financeType !== FINANCE_TYPE_EXISTING_SOLAR.TPO) {
        delete updateQuery.$set.tpoFundingSource;
        updateQuery['$unset'] = { tpoFundingSource: '' };
      }
      this.opportunityService.updateExistingSolarData(opportunityId, updateQuery);
    } else {
      this.opportunityService.updateExistingSolarData(opportunityId, {
        $set: {
          existingPV: false,
        },
        $unset: {
          existingPVSize: '',
          yearSystemInstalled: '',
          originalInstaller: '',
          inverter: '',
          financeType: '',
          tpoFundingSource: '',
          inverterManufacturer: '',
          inverterModel: '',
        },
      });
    }
  }
}
