import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { flatten, pickBy, sumBy } from 'lodash';
import { LeanDocument, Model, ObjectId, Types } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination } from 'src/app/common';
import { ContractService } from 'src/contracts/contract.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { ProposalService } from 'src/proposals/proposal.service';
import { QuotePartnerConfigService } from 'src/quote-partner-configs/quote-partner-config.service';
import { QuoteService } from 'src/quotes/quote.service';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { assignToModel } from 'src/shared/transform/assignToModel';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
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
  private SYSTEM_DESIGN_S3_BUCKET = process.env.AWS_S3_BUCKET as string;

  constructor(
    // @ts-ignore
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
    private readonly s3Service: S3Service,
    @Inject(forwardRef(() => ProposalService))
    private readonly proposalService: ProposalService,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
  ) {}

  async create(systemDesignDto: CreateSystemDesignDto): Promise<OperationResult<SystemDesignDto>> {
    if (!systemDesignDto.roofTopDesignData && !systemDesignDto.capacityProductionDesignData) {
      throw new Error('Please put your data in body');
    }

    if (
      (systemDesignDto.roofTopDesignData &&
        !systemDesignDto.roofTopDesignData.panelArray.length &&
        !systemDesignDto.roofTopDesignData.storage.length &&
        !systemDesignDto.roofTopDesignData.inverters.length) ||
      (systemDesignDto.capacityProductionDesignData &&
        !systemDesignDto.capacityProductionDesignData.panelArray.length &&
        !systemDesignDto.capacityProductionDesignData.inverters.length)
    ) {
      throw ApplicationException.ValidationFailed('Please add at least 1 product');
    }

    const systemDesign = new SystemDesignModel(systemDesignDto);
    const [utilityAndUsage, systemProductionArray] = await Promise.all([
      this.utilityService.getUtilityByOpportunityId(systemDesignDto.opportunityId),
      this.systemProductService.calculateSystemProductionByHour(systemDesignDto),
    ]);
    const annualUsageKWh = utilityAndUsage?.utilityData.actualUsage?.annualConsumption || 0;

    this.handleUpdateExistingSolar(
      systemDesignDto.opportunityId,
      systemDesignDto.isRetrofit,
      systemDesignDto.existingSolarData,
    );

    this.opportunityService.updateExistingOppDataById(systemDesignDto.opportunityId, {
      $set: {
        hasHadOtherDemandResponseProvider: systemDesignDto.hasHadOtherDemandResponseProvider,
        hasGrantedHomeBatterySystemRights: systemDesignDto.hasGrantedHomeBatterySystemRights,
      },
    });

    if (systemDesign.designMode === DESIGN_MODE.ROOF_TOP) {
      let cumulativeGenerationKWh = 0;
      let cumulativeCapacityKW = 0;

      const [thumbnail] = await Promise.all(
        flatten([
          this.s3Service.putBase64Image(this.SYSTEM_DESIGN_S3_BUCKET, systemDesignDto.thumbnail, 'public-read') as any,
          systemDesign.roofTopDesignData.panelArray.map(async (item, index) => {
            item.arrayId = Types.ObjectId();
            const { panelModelId } = systemDesignDto.roofTopDesignData.panelArray[index];
            item.panelModelId = panelModelId;
            const panelModelData = await this.productService.getDetailById(panelModelId);
            const data = { ...panelModelData, partNumber: panelModelData?.partNumber } as any;
            systemDesign.setPanelModelDataSnapshot(data, index);
            const capacity = (item.numberOfPanels * (panelModelData?.sizeW ?? 0)) / 1000;
            const acAnnual = await this.systemProductService.pvWatCalculation({
              lat: systemDesign.latitude,
              lon: systemDesign.longitude,
              azimuth: item.azimuth,
              systemCapacity: capacity,
              tilt: item.pitch,
              losses: item.losses,
            });
            cumulativeGenerationKWh += acAnnual;
            cumulativeCapacityKW += capacity;
          }),
          systemDesign.roofTopDesignData.adders.map(async (item, index) => {
            const adder = await this.adderConfigService.getAdderConfigDetail(item.adderId);
            systemDesign.setAdder(
              { ...adder, modifiedAt: adder?.modifiedAt } as any,
              this.convertIncrementAdder((adder as any)?.increment as string),
              index,
            );
          }),
          systemDesign.roofTopDesignData.inverters.map(async (inverter, index) => {
            const inverterModelData = await this.productService.getDetailById(inverter.inverterModelId);
            const data = { ...inverterModelData, partNumber: inverterModelData?.partNumber } as any;
            systemDesign.setInverter(data, index);
          }),
          systemDesign.roofTopDesignData.storage.map(async (storage, index) => {
            const storageModelData = await this.productService.getDetailById(storage.storageModelId);
            const data = { ...storageModelData, partNumber: storageModelData?.partNumber } as any;
            systemDesign.setStorage(data, index);
          }),
          systemDesign.roofTopDesignData.balanceOfSystems.map(async (balanceOfSystem, index) => {
            const balanceOfSystemModelData = await this.productService.getDetailById(balanceOfSystem.balanceOfSystemId);
            const data = {
              ...balanceOfSystemModelData,
              partNumber: balanceOfSystemModelData?.partNumber,
            } as any;
            systemDesign.setBalanceOfSystem(data, index);
          }),
          systemDesign.roofTopDesignData.ancillaryEquipments.map(async (ancillary, index) => {
            const ancillaryModelData = await this.ancillaryMasterModel.findById(ancillary.ancillaryId).lean();
            const data = { ...ancillaryModelData, ancillaryId: ancillary.ancillaryId } as any;
            systemDesign.setAncillaryEquipment(data, index);
          }),
        ]),
      );

      systemDesign.setThumbnail(thumbnail);
      // systemDesign.setIsSelected(systemDesignDto.isSelected);

      systemDesign.setSystemProductionData({
        capacityKW: cumulativeCapacityKW,
        generationKWh: cumulativeGenerationKWh,
        productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
        annualUsageKWh,
        offsetPercentage: annualUsageKWh > 0 ? cumulativeGenerationKWh / annualUsageKWh : 0,
        generationMonthlyKWh: systemProductionArray.monthly,
      });
    } else if (systemDesign.designMode === DESIGN_MODE.CAPACITY_PRODUCTION) {
      const {
        inverters,
        storage,
        adders,
        balanceOfSystems,
        ancillaryEquipments,
      } = systemDesign.capacityProductionDesignData;

      let cumulativeGenerationKWh = 0;
      let cumulativeCapacityKW = 0;

      await Promise.all(
        flatten([
          systemDesign.capacityProductionDesignData.panelArray.map(async (item, index) => {
            const { panelModelId, capacity, production, pitch, azimuth, losses } = item;
            const newObjectId = Types.ObjectId();
            let generation = 0;

            const panelModelData = await this.productService.getDetailById(panelModelId);
            const data = { ...panelModelData, partNumber: panelModelData?.partNumber } as any;
            systemDesign.setPanelModelDataSnapshot(data, index, systemDesign.designMode);

            const relatedInverterIndex = systemDesign.capacityProductionDesignData.inverters.findIndex(
              inverter => inverter.arrayId === item.arrayId,
            );
            if (relatedInverterIndex !== -1) {
              systemDesign.capacityProductionDesignData.inverters[relatedInverterIndex].arrayId = newObjectId;
            }
            item.arrayId = newObjectId;

            if (production > 0) {
              generation = production;
            } else {
              generation = await this.systemProductService.pvWatCalculation({
                lat: systemDesign.latitude,
                lon: systemDesign.longitude,
                azimuth,
                systemCapacity: capacity,
                tilt: pitch,
                losses,
              });
            }
            cumulativeCapacityKW += capacity;
            cumulativeGenerationKWh += generation;

            systemDesign.setCapacitySystemProduction(
              {
                capacityKW: capacity,
                generationKWh: generation,
                productivity: capacity === 0 ? 0 : generation / capacity,
                annualUsageKWh,
                offsetPercentage: annualUsageKWh > 0 ? generation / annualUsageKWh : 0,
                generationMonthlyKWh: systemProductionArray.monthly,
              },
              index,
            );
          }),
          inverters.map(async (inverter, index) => {
            const inverterModelData = await this.productService.getDetailById(inverter.inverterModelId);
            const data = { ...inverterModelData, partNumber: inverterModelData?.partNumber } as any;
            systemDesign.setInverter(data, index, systemDesign.designMode);
          }),
          storage.map(async (storage, index) => {
            const storageModelData = await this.productService.getDetailById(storage.storageModelId);
            const data = { ...storageModelData, partNumber: storageModelData?.partNumber } as any;
            systemDesign.setStorage(data, index, systemDesign.designMode);
          }),
          adders.map(async (item, index) => {
            const adder = await this.adderConfigService.getAdderConfigDetail(item.adderId);
            systemDesign.setAdder(
              { ...adder, modifiedAt: adder?.modifiedAt } as any,
              this.convertIncrementAdder((adder as any)?.increment as string),
              index,
              systemDesign.designMode,
            );
          }),
          balanceOfSystems.map(async (balanceOfSystem, index) => {
            const balanceOfSystemModelData = await this.productService.getDetailById(balanceOfSystem.balanceOfSystemId);
            const data = {
              ...balanceOfSystemModelData,
              partNumber: balanceOfSystemModelData?.partNumber,
            } as any;
            systemDesign.setBalanceOfSystem(data, index, systemDesign.designMode);
          }),
          ancillaryEquipments.map(async (ancillary, index) => {
            const ancillaryModelData = await this.ancillaryMasterModel.findById(ancillary.ancillaryId).lean();
            const data = { ...ancillaryModelData, ancillaryId: ancillary.ancillaryId } as any;
            systemDesign.setAncillaryEquipment(data, index, systemDesign.designMode);
          }),
        ]),
      );

      systemDesign.setSystemProductionData({
        capacityKW: cumulativeCapacityKW,
        generationKWh: cumulativeGenerationKWh,
        productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
        annualUsageKWh,
        offsetPercentage: annualUsageKWh > 0 ? cumulativeGenerationKWh / annualUsageKWh : 0,
        generationMonthlyKWh: systemProductionArray.monthly,
      });
    }

    const netUsagePostInstallation = this.systemProductService.calculateNetUsagePostSystemInstallation(
      (utilityAndUsage?.utilityData?.actualUsage?.hourlyUsage || []).map(item => item.v),
      systemProductionArray.hourly,
    );

    const costPostInstallation = await this.utilityService.calculateCost(
      netUsagePostInstallation.hourlyNetUsage,
      utilityAndUsage?.costData?.masterTariffId || '',
      CALCULATION_MODE.TYPICAL,
      new Date().getFullYear(),
      utilityAndUsage?.utilityData?.typicalBaselineUsage?.zipCode,
    );

    systemDesign.setNetUsagePostInstallation(netUsagePostInstallation);
    systemDesign.setCostPostInstallation(costPostInstallation);

    const createdSystemDesign = new this.systemDesignModel(systemDesign);
    await createdSystemDesign.save();

    return OperationResult.ok(strictPlainToClass(SystemDesignDto, createdSystemDesign.toJSON()));
  }

  async calculateSystemDesign<AuxCalculateResult>(
    systemDesign: SystemDesignModel,
    systemDesignDto: UpdateSystemDesignDto,
    preCalculate?: () => Promise<void>,
    extendCalculate?: () => Promise<AuxCalculateResult>,
    postExtendCalculate?: (result: [AuxCalculateResult, ...unknown[]]) => void,
    dispatch?: (systemDesign: SystemDesignModel) => Promise<void>,
  ): Promise<Partial<SystemDesignModel>> {
    if (preCalculate) await preCalculate();

    const [utilityAndUsage, systemProductionArray] = await Promise.all([
      this.utilityService.getUtilityByOpportunityId(systemDesignDto.opportunityId),
      this.systemProductService.calculateSystemProductionByHour(systemDesignDto),
    ]);
    const annualUsageKWh = utilityAndUsage?.utilityData.actualUsage?.annualConsumption || 0;

    if (systemDesignDto.roofTopDesignData) {
      let cumulativeGenerationKWh = 0;
      let cumulativeCapacityKW = 0;

      const handlers = [
        systemDesign.roofTopDesignData.panelArray.map(async (item, index) => {
          item.arrayId = Types.ObjectId();
          const { panelModelId } = systemDesignDto.roofTopDesignData.panelArray[index];
          item.panelModelId = panelModelId;
          const panelModelData = await this.productService.getDetailById(panelModelId);
          const data = { ...panelModelData, part_number: panelModelData?.partNumber } as any;
          systemDesign.setPanelModelDataSnapshot(data, index);
          const capacity = (item.numberOfPanels * (panelModelData?.sizeW ?? 0)) / 1000;
          const acAnnual = await this.systemProductService.pvWatCalculation({
            lat: systemDesign.latitude,
            lon: systemDesign.longitude,
            azimuth: item.azimuth,
            systemCapacity: capacity,
            tilt: item.pitch,
            losses: item.losses,
          });
          cumulativeGenerationKWh += acAnnual;
          cumulativeCapacityKW += capacity;
        }),
        systemDesign.roofTopDesignData.adders?.map(async (item, index) => {
          const adder = await this.adderConfigService.getAdderConfigDetail(item.adderId);
          systemDesign.setAdder(
            { ...adder, modified_at: adder?.modifiedAt } as any,
            this.convertIncrementAdder((adder as any)?.increment as string),
            index,
          );
        }),
        systemDesign.roofTopDesignData.inverters?.map(async (inverter, index) => {
          const inverterModelData = await this.productService.getDetailById(inverter.inverterModelId);
          const data = { ...inverterModelData, part_number: inverterModelData?.partNumber } as any;
          systemDesign.setInverter(data, index);
        }),
        systemDesign.roofTopDesignData.storage?.map(async (storage, index) => {
          const storageModelData = await this.productService.getDetailById(storage.storageModelId);
          const data = { ...storageModelData, part_number: storageModelData?.partNumber } as any;
          systemDesign.setStorage(data, index);
        }),
        systemDesign.roofTopDesignData.balanceOfSystems?.map(async (balanceOfSystem, index) => {
          const balanceOfSystemModelData = await this.productService.getDetailById(balanceOfSystem.balanceOfSystemId);
          const data = {
            ...balanceOfSystemModelData,
            partNumber: balanceOfSystemModelData?.partNumber,
          } as any;
          systemDesign.setBalanceOfSystem(data, index);
        }),
        systemDesign.roofTopDesignData.ancillaryEquipments?.map(async (ancillary, index) => {
          const ancillaryModelData = await this.ancillaryMasterModel.findById(ancillary.ancillaryId).lean();
          systemDesign.setAncillaryEquipment(ancillaryModelData as any, index);
        }),
      ];

      if (extendCalculate) {
        handlers.unshift(extendCalculate() as any);
      }

      const result = await Promise.all(flatten(handlers));

      if (extendCalculate && postExtendCalculate) {
        postExtendCalculate(result as any);
      }

      systemDesign.setSystemProductionData({
        capacityKW: cumulativeCapacityKW,
        generationKWh: cumulativeGenerationKWh,
        productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
        annualUsageKWh,
        offsetPercentage: annualUsageKWh > 0 ? cumulativeGenerationKWh / annualUsageKWh : 0,
        generationMonthlyKWh: systemProductionArray.monthly,
      });

      const netUsagePostInstallation = this.systemProductService.calculateNetUsagePostSystemInstallation(
        (utilityAndUsage?.utilityData?.actualUsage?.hourlyUsage || []).map(item => item.v),
        systemProductionArray.hourly,
      );

      const costPostInstallation = await this.utilityService.calculateCost(
        netUsagePostInstallation.hourlyNetUsage,
        utilityAndUsage?.costData?.masterTariffId || '',
        CALCULATION_MODE.TYPICAL,
        new Date().getFullYear(),
        utilityAndUsage?.utilityData?.typicalBaselineUsage?.zipCode,
      );

      systemDesign.setNetUsagePostInstallation(netUsagePostInstallation);
      systemDesign.setCostPostInstallation(costPostInstallation);

      if (dispatch) {
        await dispatch(systemDesign);
      }

      return pickBy(systemDesign, item => typeof item !== 'undefined');
    }

    if (systemDesignDto.capacityProductionDesignData) {
      const {
        adders,
        inverters,
        storage,
        balanceOfSystems,
        ancillaryEquipments,
      } = systemDesignDto.capacityProductionDesignData;
      let cumulativeGenerationKWh = 0;
      let cumulativeCapacityKW = 0;

      const handlers = [
        systemDesign.capacityProductionDesignData.panelArray.map(async (item, index) => {
          const { panelModelId, capacity, production, pitch, azimuth, losses } = item;
          const newObjectId = Types.ObjectId();
          let generation = 0;

          const panelModelData = await this.productService.getDetailById(panelModelId);
          const data = { ...panelModelData, partNumber: panelModelData?.partNumber } as any;
          systemDesign.setPanelModelDataSnapshot(data, index, systemDesign.designMode);

          const relatedInverterIndex = systemDesign.capacityProductionDesignData.inverters.findIndex(
            inverter => inverter.arrayId === item.arrayId,
          );
          if (relatedInverterIndex !== -1) {
            systemDesign.capacityProductionDesignData.inverters[relatedInverterIndex].arrayId = newObjectId;
          }
          item.arrayId = newObjectId;

          if (production > 0) {
            generation = production;
          } else {
            generation = await this.systemProductService.pvWatCalculation({
              lat: systemDesign.latitude,
              lon: systemDesign.longitude,
              azimuth,
              systemCapacity: capacity,
              tilt: pitch,
              losses,
            });
          }
          cumulativeCapacityKW += capacity;
          cumulativeGenerationKWh += generation;

          systemDesign.setCapacitySystemProduction(
            {
              capacityKW: capacity,
              generationKWh: generation,
              productivity: capacity === 0 ? 0 : generation / capacity,
              annualUsageKWh,
              offsetPercentage: annualUsageKWh > 0 ? generation / annualUsageKWh : 0,
              generationMonthlyKWh: systemProductionArray.monthly,
            },
            index,
          );
        }),
        adders?.map(async (item, index) => {
          const adder = await this.adderConfigService.getAdderConfigDetail(item.adderId);
          systemDesign.setAdder(
            { ...adder, modified_at: adder?.modifiedAt } as any,
            this.convertIncrementAdder((adder as any)?.increment as string),
            index,
            systemDesign.designMode,
          );
        }),
        inverters?.map(async (inverter, index) => {
          const inverterModelData = await this.productService.getDetailById(inverter.inverterModelId);
          const data = { ...inverterModelData, part_number: inverterModelData?.partNumber } as any;
          systemDesign.setInverter(data, index, systemDesign.designMode);
        }),
        storage?.map(async (storage, index) => {
          const storageModelData = await this.productService.getDetailById(storage.storageModelId);
          const data = { ...storageModelData, part_number: storageModelData?.partNumber } as any;
          systemDesign.setStorage(data, index, systemDesign.designMode);
        }),
        balanceOfSystems?.map(async (balanceOfSystem, index) => {
          const balanceOfSystemModelData = await this.productService.getDetailById(balanceOfSystem.balanceOfSystemId);
          const data = {
            ...balanceOfSystemModelData,
            partNumber: balanceOfSystemModelData?.partNumber,
          } as any;
          systemDesign.setBalanceOfSystem(data, index, systemDesign.designMode);
        }),
        ancillaryEquipments?.map(async (ancillary, index) => {
          const ancillaryModelData = await this.ancillaryMasterModel.findById(ancillary.ancillaryId).lean();
          systemDesign.setAncillaryEquipment(ancillaryModelData as any, index, systemDesign.designMode);
        }),
      ];

      if (extendCalculate) {
        handlers.unshift(extendCalculate() as any);
      }

      const result = await Promise.all(flatten(handlers));

      if (extendCalculate && postExtendCalculate) {
        postExtendCalculate(result as any);
      }

      systemDesign.setSystemProductionData({
        capacityKW: cumulativeCapacityKW,
        generationKWh: cumulativeGenerationKWh,
        productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
        annualUsageKWh,
        offsetPercentage: annualUsageKWh > 0 ? cumulativeGenerationKWh / annualUsageKWh : 0,
        generationMonthlyKWh: systemProductionArray.monthly,
      });

      const netUsagePostInstallation = this.systemProductService.calculateNetUsagePostSystemInstallation(
        (utilityAndUsage?.utilityData?.actualUsage?.hourlyUsage || []).map(item => item.v),
        systemProductionArray.hourly,
      );

      const costPostInstallation = await this.utilityService.calculateCost(
        netUsagePostInstallation.hourlyNetUsage,
        utilityAndUsage?.costData?.masterTariffId || '',
        CALCULATION_MODE.TYPICAL,
        new Date().getFullYear(),
        utilityAndUsage?.utilityData?.typicalBaselineUsage?.zipCode,
      );

      systemDesign.setNetUsagePostInstallation(netUsagePostInstallation);
      systemDesign.setCostPostInstallation(costPostInstallation);

      if (dispatch) {
        await dispatch(systemDesign);
      }

      return pickBy(systemDesign, item => typeof item !== 'undefined');
    }

    return pickBy(systemDesign, item => typeof item !== 'undefined');
  }

  async update(id: ObjectId, systemDesignDto: UpdateSystemDesignDto): Promise<OperationResult<SystemDesignDto>> {
    if (
      (systemDesignDto.roofTopDesignData &&
        !systemDesignDto.roofTopDesignData.panelArray.length &&
        !systemDesignDto.roofTopDesignData.storage.length &&
        !systemDesignDto.roofTopDesignData.inverters.length) ||
      (systemDesignDto.capacityProductionDesignData &&
        !systemDesignDto.capacityProductionDesignData.panelArray.length &&
        !systemDesignDto.capacityProductionDesignData.inverters.length)
    ) {
      throw ApplicationException.ValidationFailed('Please add at least 1 product');
    }

    const foundSystemDesign = await this.systemDesignModel.findById(id);

    if (!foundSystemDesign) {
      throw ApplicationException.EntityNotFound(id.toString());
    }

    const isInUsed = await this.checkInUsed(id.toString());

    if (isInUsed) {
      throw new BadRequestException(isInUsed);
    }

    const systemDesign = new SystemDesignModel(pickBy(systemDesignDto, item => typeof item !== 'undefined') as any);

    if (systemDesignDto.name) {
      systemDesign.name = systemDesignDto.name;
    }

    if (systemDesignDto.isSolar) {
      systemDesign.setIsSolar(systemDesignDto.isSolar);
    }

    this.handleUpdateExistingSolar(
      systemDesignDto.opportunityId,
      systemDesignDto.isRetrofit,
      systemDesignDto.existingSolarData,
    );

    if (typeof systemDesignDto.hasHadOtherDemandResponseProvider === 'boolean') {
      this.opportunityService.updateExistingOppDataById(systemDesignDto.opportunityId, {
        $set: {
          hasHadOtherDemandResponseProvider: systemDesignDto.hasHadOtherDemandResponseProvider,
        },
      });
    }
    if (typeof systemDesignDto.hasGrantedHomeBatterySystemRights === 'boolean') {
      this.opportunityService.updateExistingOppDataById(systemDesignDto.opportunityId, {
        $set: {
          hasGrantedHomeBatterySystemRights: systemDesignDto.hasGrantedHomeBatterySystemRights,
        },
      });
    }

    if (systemDesignDto.isRetrofit) {
      systemDesign.setIsRetrofit(systemDesignDto.isRetrofit);
    }

    const removedUndefined = await this.calculateSystemDesign(systemDesign, systemDesignDto, async () => {
      if (systemDesignDto.thumbnail) {
        const [thumbnail] = await Promise.all([
          this.s3Service.putBase64Image(this.SYSTEM_DESIGN_S3_BUCKET, systemDesignDto.thumbnail, 'public-read') as any,
          this.s3Service.deleteObject(
            this.SYSTEM_DESIGN_S3_BUCKET,
            this.s3Service.getLocationFromUrl(foundSystemDesign.thumbnail).keyName,
          ),
        ]);
        systemDesign.setThumbnail(thumbnail);
      }
    });

    delete removedUndefined?._id;

    assignToModel(foundSystemDesign, removedUndefined);

    await Promise.all([
      // this.systemDesignModel.updateOne({_id: foundSystemDesign._id}, {$set: {...removedUndefined} as any});
      foundSystemDesign.save(),
      // foundSystemDesign.updateOne(removedUndefined as any),
      systemDesignDto.designMode && this.quoteService.setOutdatedData(systemDesignDto.opportunityId, 'System Design'),
    ]);

    return OperationResult.ok(strictPlainToClass(SystemDesignDto, foundSystemDesign.toJSON()));
  }

  async recalculateSystemDesign(
    id: ObjectId | null,
    systemDesignDto: UpdateSystemDesignDto,
  ): Promise<OperationResult<SystemDesignDto>> {
    if (!systemDesignDto.roofTopDesignData && !systemDesignDto.capacityProductionDesignData) {
      throw new Error('Please put your data in body');
    }

    if (
      systemDesignDto.roofTopDesignData &&
      !systemDesignDto.roofTopDesignData.panelArray.length &&
      !systemDesignDto.roofTopDesignData.storage.length &&
      !systemDesignDto.roofTopDesignData.inverters.length
    ) {
      throw ApplicationException.ValidationFailed('Please add at least 1 product');
    }

    if (id) {
      const foundSystemDesign = await this.systemDesignModel.findOne({ _id: id });

      if (!foundSystemDesign) throw ApplicationException.NotFoundStatus('System Design', id.toString());

      const systemDesign = new SystemDesignModel(pickBy(systemDesignDto, item => typeof item !== 'undefined') as any);

      const result = await this.calculateSystemDesign(systemDesign, systemDesignDto);

      return OperationResult.ok(
        strictPlainToClass(SystemDesignDto, {
          ...foundSystemDesign.toJSON(),
          ...result,
        }),
      );
    }

    const systemDesign = new SystemDesignModel(pickBy(systemDesignDto, item => typeof item !== 'undefined') as any);

    const result = await this.calculateSystemDesign(systemDesign, systemDesignDto);

    return OperationResult.ok(strictPlainToClass(SystemDesignDto, result!));
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

    const response = strictPlainToClass(GetInverterClippingDetailResDto, {
      panelAndInverterDetail: req.panelAndInverterDetail,
      clippingDetails: {
        totalSTCProductionInWatt: totalPvSTCRating,
        totalInverterCapacityInWatt: totalInverterRating,
        recommendationDetail: {} as any,
      },
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

  async delete(id: ObjectId, opportunityId: string): Promise<OperationResult<string>> {
    const systemDesign = await this.systemDesignModel.findOne({ _id: id, opportunityId });
    if (!systemDesign) {
      throw ApplicationException.EntityNotFound(id.toString());
    }

    const isInUsed = await this.checkInUsed(id.toString());

    if (isInUsed) {
      throw new BadRequestException(isInUsed);
    }

    await systemDesign.deleteOne();
    return OperationResult.ok('Deleted Successfully');
  }

  async getAllSystemDesigns(
    limit: number,
    skip: number,
    opportunityId: string,
  ): Promise<OperationResult<Pagination<SystemDesignDto>>> {
    const [systemDesigns, count] = await Promise.all([
      this.systemDesignModel.find({ opportunityId }).limit(limit).skip(skip).lean(),
      this.systemDesignModel.countDocuments({ opportunityId }).lean(),
    ]);

    const checkedSystemDesigns = await Promise.all(
      systemDesigns.map(async systemDesign => {
        const isInUsed = await this.checkInUsed(systemDesign._id.toString());
        return {
          ...systemDesign,
          editable: !isInUsed,
          editableMessage: isInUsed || null,
        };
      }),
    );

    return OperationResult.ok(
      new Pagination({ data: strictPlainToClass(SystemDesignDto, checkedSystemDesigns), total: count }),
    );
  }

  async getDetails(id: ObjectId): Promise<OperationResult<SystemDesignDto>> {
    const foundSystemDesign = await this.systemDesignModel.findOne({ _id: id }).lean();
    if (!foundSystemDesign) {
      throw ApplicationException.EntityNotFound(id.toString());
    }

    const isInUsed = await this.checkInUsed(id.toString());

    return OperationResult.ok(
      strictPlainToClass(SystemDesignDto, {
        ...foundSystemDesign,
        editable: !isInUsed,
        editableMessage: isInUsed || null,
      } as any),
    );
  }

  async getAncillaryList(): Promise<OperationResult<Pagination<SystemDesignAncillaryMasterDto>>> {
    const res = await this.ancillaryMasterModel.find().lean();
    return OperationResult.ok(
      new Pagination({ data: strictPlainToClass(SystemDesignAncillaryMasterDto, res), total: res.length }),
    );
  }

  async updateAncillaryMaster(
    id: ObjectId,
    req: UpdateAncillaryMasterDtoReq,
  ): Promise<OperationResult<SystemDesignAncillaryMasterDto>> {
    const updatedModel = await this.ancillaryMasterModel
      .findByIdAndUpdate(id, { insertionRule: req.insertionRule }, { new: true })
      .lean();

    return OperationResult.ok(strictPlainToClass(SystemDesignAncillaryMasterDto, updatedModel));
  }

  //  ->>>>>>>>>>>>>>>>>>>>>>>>> INTERNAL <<<<<<<<<<<<<<<<<<<<<<<<<<<-

  async getOneById(id: string | ObjectId): Promise<LeanDocument<SystemDesign> | null> {
    const systemDesign = await this.systemDesignModel.findById(id).lean();
    return systemDesign;
  }

  async getRoofTopDesignById(id: string): Promise<IRoofTopSchema | undefined> {
    const systemDesign = await this.systemDesignModel.findById(id).lean();
    return systemDesign?.roofTopDesignData;
  }

  async updateListSystemDesign(opportunityId: string, annualUsageKWh: number): Promise<boolean> {
    const systemDesigns = await this.systemDesignModel.find({ opportunityId });

    try {
      await Promise.all(
        systemDesigns.map(item => {
          item.systemProductionData.annualUsageKWh = annualUsageKWh;
          item.systemProductionData.offsetPercentage =
            annualUsageKWh > 0 ? item.systemProductionData.generationKWh / annualUsageKWh : 0;
          return item.save();
        }),
      );
    } catch (error) {
      return false;
    }

    return true;
  }

  async countByOpportunityId(opportunityId: string): Promise<number> {
    const counter = await this.systemDesignModel.countDocuments({ opportunityId }).lean();
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
        // eslint-disable-next-line
        updateQuery['$unset'] = { tpoFundingSource: '' };
      }
      this.opportunityService.updateExistingOppDataById(opportunityId, updateQuery);
    } else {
      this.opportunityService.updateExistingOppDataById(opportunityId, {
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

  async checkInUsed(systemDesignId: string): Promise<boolean | string> {
    const hasProposals = await this.proposalService.existBySystemDesignId(systemDesignId);

    if (hasProposals) {
      return hasProposals('This system design');
    }

    const hasContracts = await this.contractService.existBySystemDesignId(systemDesignId);

    if (hasContracts) {
      return hasContracts('This system design');
    }

    return false;
  }
}
