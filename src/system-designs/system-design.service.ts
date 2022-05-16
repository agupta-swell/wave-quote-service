import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { flatten, pickBy, uniq } from 'lodash';
import { LeanDocument, Model, ObjectId, Types } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination } from 'src/app/common';
import { ContractService } from 'src/contracts/contract.service';
import { ManufacturerService } from 'src/manufacturers/manufacturer.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { IProductDocument, IUnknownProduct } from 'src/products-v2/interfaces';
import { ProductService } from 'src/products-v2/services';
import { ProposalService } from 'src/proposals/proposal.service';
import { QuotePartnerConfigService } from 'src/quote-partner-configs/quote-partner-config.service';
import { QuoteService } from 'src/quotes/quote.service';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { GoogleSunroofService } from 'src/shared/google-sunroof/google-sunroof.service';
import { attachMeta } from 'src/shared/mongo';
import { assignToModel } from 'src/shared/transform/assignToModel';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { SystemProductionService } from 'src/system-production/system-production.service';
import {
  calcCoordinatesDistance,
  ICoordinate,
  isCoordinatesInsideBoundByAtLeast,
} from 'src/utils/calculate-coordinates';
import { CALCULATION_MODE } from '../utilities/constants';
import { UtilityService } from '../utilities/utility.service';
import { DESIGN_MODE, FINANCE_TYPE_EXISTING_SOLAR } from './constants';
import {
  CalculateSunroofOrientationDto,
  CreateSystemDesignDto,
  ExistingSolarDataDto,
  GetBoundingBoxesReqDto,
  UpdateAncillaryMasterDtoReq,
  UpdateSystemDesignDto,
} from './req';
import { CalculateSunroofOrientationResDto, GetBoundingBoxesResDto, SystemDesignAncillaryMasterDto, SystemDesignDto } from './res';
import { getTypicalProduction, ISystemProduction, SystemProductService } from './sub-services';
import {
  IRoofTopSchema,
  SystemDesign,
  SystemDesignModel,
  SystemDesignWithManufacturerMeta,
  SYSTEM_DESIGN,
} from './system-design.schema';

import { GoogleSunroof } from '../shared/google-sunroof/sub-services/types'

@Injectable()
export class SystemDesignService {
  private SYSTEM_DESIGN_S3_BUCKET = process.env.AWS_S3_BUCKET as string;

  constructor(
    // @ts-ignore
    @InjectModel(SYSTEM_DESIGN) private readonly systemDesignModel: Model<SystemDesign>,
    private readonly systemProductService: SystemProductService,
    @Inject(forwardRef(() => UtilityService))
    private readonly utilityService: UtilityService,
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
    private readonly googleSunroofService: GoogleSunroofService,
    private readonly productService: ProductService,
    private readonly manufacturerService: ManufacturerService,
    @Inject(forwardRef(() => SystemProductionService))
    private readonly systemProductionService: SystemProductionService,
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
    const annualUsageKWh = utilityAndUsage?.utilityData.computedUsage?.annualConsumption || 0;

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

    const arrayGenerationKWh: number[] = [];
    let cumulativeGenerationKWh = 0;
    let cumulativeCapacityKW = 0;

    if (systemDesign.designMode === DESIGN_MODE.ROOF_TOP) {
      const [thumbnail] = await Promise.all(
        flatten([
          this.s3Service.putBase64Image(this.SYSTEM_DESIGN_S3_BUCKET, systemDesignDto.thumbnail, 'public-read') as any,
          systemDesign.roofTopDesignData.panelArray.map(async (item, index) => {
            item.arrayId = Types.ObjectId.isValid(item.arrayId) ? item.arrayId : Types.ObjectId();

            const { panelModelId } = systemDesignDto.roofTopDesignData.panelArray[index];

            item.panelModelId = panelModelId;

            const panelModelData = await this.productService.getDetailByIdAndType(PRODUCT_TYPE.MODULE, panelModelId);

            systemDesign.setPanelModelDataSnapshot(panelModelData, index);

            const capacity = (item.numberOfPanels * (panelModelData.ratings.watts ?? 0)) / 1000;

            const { useSunroof, sunroofAzimuth, sunroofPitch, azimuth, pitch } = item;

            const acAnnual = await this.systemProductService.pvWatCalculation({
              lat: systemDesign.latitude,
              lon: systemDesign.longitude,
              azimuth: useSunroof && sunroofAzimuth !== undefined ? sunroofAzimuth : azimuth,
              systemCapacity: capacity,
              tilt: useSunroof && sunroofPitch !== undefined ? sunroofPitch : pitch,
              losses: item.losses,
            });

            arrayGenerationKWh[index] = acAnnual;
            cumulativeGenerationKWh += acAnnual;
            cumulativeCapacityKW += capacity;
          }),

          systemDesign.roofTopDesignData.adders.map(async (item, index) => {
            const adder = await this.productService.getDetailByIdAndType(PRODUCT_TYPE.ADDER, item.adderId);

            systemDesign.setAdder(adder, adder.pricingUnit, index);
          }),

          systemDesign.roofTopDesignData.inverters.map(async (inverter, index) => {
            const inverterModelData = await this.productService.getDetailByIdAndType(
              PRODUCT_TYPE.INVERTER,
              inverter.inverterModelId,
            );

            systemDesign.setInverter(inverterModelData, index);
          }),

          systemDesign.roofTopDesignData.storage.map(async (storage, index) => {
            const storageModelData = await this.productService.getDetailByIdAndType(
              PRODUCT_TYPE.BATTERY,
              storage.storageModelId,
            );

            systemDesign.setStorage(storageModelData, index);
          }),

          systemDesign.roofTopDesignData.balanceOfSystems.map(async (balanceOfSystem, index) => {
            const balanceOfSystemModelData = await this.productService.getDetailByIdAndType(
              PRODUCT_TYPE.BALANCE_OF_SYSTEM,
              balanceOfSystem.balanceOfSystemId,
            );

            systemDesign.setBalanceOfSystem(balanceOfSystemModelData, index, systemDesign.designMode);
          }),

          systemDesign.roofTopDesignData.ancillaryEquipments.map(async (ancillary, index) => {
            const ancillaryModelData = await this.productService.getDetailByIdAndType(
              PRODUCT_TYPE.ANCILLARY_EQUIPMENT,
              ancillary.ancillaryId,
            );

            systemDesign.setAncillaryEquipment(ancillaryModelData, index, systemDesign.designMode);
          }),

          systemDesign.roofTopDesignData.softCosts?.map(async (softCost, index) => {
            const softCostModelData = await this.productService.getDetailByIdAndType(
              PRODUCT_TYPE.SOFT_COST,
              softCost.softCostId,
            );

            systemDesign.setSoftCost(softCostModelData, index, systemDesign.designMode);
          }),

          systemDesign.roofTopDesignData.laborCosts.map(async (laborCost, index) => {
            const laborCostModelData = await this.productService.getDetailByIdAndType(
              PRODUCT_TYPE.LABOR,
              laborCost.laborCostId,
            );

            systemDesign.setLaborCost(laborCostModelData, index, systemDesign.designMode);
          }),
        ]),
      );

      systemDesign.setThumbnail(thumbnail);
    } else if (systemDesign.designMode === DESIGN_MODE.CAPACITY_PRODUCTION) {
      const {
        inverters,
        storage,
        adders,
        balanceOfSystems,
        ancillaryEquipments,
        softCosts,
        laborCosts,
      } = systemDesign.capacityProductionDesignData;

      await Promise.all(
        flatten([
          systemDesign.capacityProductionDesignData.panelArray.map(async (item, index) => {
            const { panelModelId, capacity, production, pitch, azimuth, losses } = item;
            const newObjectId = Types.ObjectId();
            let generation = 0;

            const panelModelData = await this.productService.getDetailByIdAndType(PRODUCT_TYPE.MODULE, panelModelId);

            systemDesign.setPanelModelDataSnapshot(panelModelData, index, systemDesign.designMode);

            const relatedInverterIndex =
              systemDesign.capacityProductionDesignData.inverters?.findIndex(
                inverter => inverter.arrayId === item.arrayId,
              ) ?? -1;

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

            arrayGenerationKWh[index] = capacity;
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
                arrayGenerationKWh,
              },
              index,
            );
          }),
          inverters.map(async (inverter, index) => {
            const inverterModelData = await this.productService.getDetailByIdAndType(
              PRODUCT_TYPE.INVERTER,
              inverter.inverterModelId,
            );

            systemDesign.setInverter(inverterModelData, index, systemDesign.designMode);
          }),
          storage.map(async (storage, index) => {
            const storageModelData = await this.productService.getDetailByIdAndType(
              PRODUCT_TYPE.BATTERY,
              storage.storageModelId,
            );

            systemDesign.setStorage(storageModelData, index, systemDesign.designMode);
          }),
          adders.map(async (item, index) => {
            const adder = await this.productService.getDetailByIdAndType(PRODUCT_TYPE.ADDER, item.adderId);

            systemDesign.setAdder(adder, adder.pricingUnit, index, systemDesign.designMode);
          }),
          balanceOfSystems.map(async (balanceOfSystem, index) => {
            const balanceOfSystemModelData = await this.productService.getDetailByIdAndType(
              PRODUCT_TYPE.BALANCE_OF_SYSTEM,
              balanceOfSystem.balanceOfSystemId,
            );

            systemDesign.setBalanceOfSystem(balanceOfSystemModelData, index, systemDesign.designMode);
          }),
          ancillaryEquipments.map(async (ancillary, index) => {
            const ancillaryModelData = await this.productService.getDetailByIdAndType(
              PRODUCT_TYPE.ANCILLARY_EQUIPMENT,
              ancillary.ancillaryId,
            );

            systemDesign.setAncillaryEquipment(ancillaryModelData, index, systemDesign.designMode);
          }),
          softCosts?.map(async (softCost, index) => {
            const softCostModelData = await this.productService.getDetailByIdAndType(
              PRODUCT_TYPE.SOFT_COST,
              softCost.softCostId,
            );

            systemDesign.setSoftCost(softCostModelData, index, systemDesign.designMode);
          }),

          laborCosts.map(async (laborCost, index) => {
            const laborCostModelData = await this.productService.getDetailByIdAndType(
              PRODUCT_TYPE.LABOR,
              laborCost.laborCostId,
            );

            systemDesign.setLaborCost(laborCostModelData, index, systemDesign.designMode);
          }),
        ]),
      );
    }

    // create systemProduction then save only systemProduction.id to current systemDesign
    const newSystemProduction = await this.systemProductionService.create({
      capacityKW: cumulativeCapacityKW,
      generationKWh: cumulativeGenerationKWh,
      productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
      annualUsageKWh,
      offsetPercentage: annualUsageKWh > 0 ? cumulativeGenerationKWh / annualUsageKWh : 0,
      generationMonthlyKWh: systemProductionArray.monthly,
      arrayGenerationKWh,
      pvWattProduction: getTypicalProduction(systemProductionArray.hourly), // calculate pv watt production typical
    });

    if (newSystemProduction.data) {
      systemDesign.systemProductionId = newSystemProduction.data.id;
    }

    const netUsagePostInstallation = this.systemProductService.calculateNetUsagePostSystemInstallation(
      (utilityAndUsage?.utilityData?.computedUsage?.hourlyUsage || []).map(item => item.v),
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

    const newSystemDesign = (await createdSystemDesign.save()).toJSON();

    // expose systemProduction's props
    if (newSystemProduction.data) {
      newSystemDesign.systemProductionData = newSystemProduction.data;
    }

    return OperationResult.ok(strictPlainToClass(SystemDesignDto, newSystemDesign));
  }

  async calculateSystemDesign<AuxCalculateResult>({
    systemDesign,
    systemDesignDto,
    preCalculate,
    extendCalculate,
    postExtendCalculate,
    dispatch,
    remainArrayId,
  }: {
    systemDesign: SystemDesignModel;
    systemDesignDto: UpdateSystemDesignDto;
    preCalculate?: () => Promise<void>;
    extendCalculate?: () => Promise<AuxCalculateResult>;
    postExtendCalculate?: (result: [AuxCalculateResult, ...unknown[]]) => void;
    dispatch?: (systemDesign: SystemDesignModel) => Promise<void>;
    remainArrayId?: boolean;
  }): Promise<Partial<SystemDesignModel>> {
    if (preCalculate) await preCalculate();

    const [utilityAndUsage, products] = await Promise.all([
      this.utilityService.getUtilityByOpportunityId(systemDesignDto.opportunityId),
      this.getAllProductsOfSystemDesign(systemDesignDto),
    ]);

    const systemProductionArray = await this.systemProductService.calculateSystemProductionByHour(
      systemDesignDto,
      products,
    );

    const annualUsageKWh = utilityAndUsage?.utilityData.computedUsage?.annualConsumption || 0;

    const adders = products.filter(item => item.type === PRODUCT_TYPE.ADDER) as LeanDocument<
      IProductDocument<PRODUCT_TYPE.ADDER>
    >[];

    const inverters = products.filter(item => item.type === PRODUCT_TYPE.INVERTER) as LeanDocument<
      IProductDocument<PRODUCT_TYPE.INVERTER>
    >[];

    const storages = (products.filter(item => item.type === PRODUCT_TYPE.BATTERY) as unknown) as LeanDocument<
      IProductDocument<PRODUCT_TYPE.BATTERY>
    >[];

    const balanceOfSystems = products.filter(item => item.type === PRODUCT_TYPE.BALANCE_OF_SYSTEM) as LeanDocument<
      IProductDocument<PRODUCT_TYPE.BALANCE_OF_SYSTEM>
    >[];

    const ancilaryEquipments = products.filter(item => item.type === PRODUCT_TYPE.ANCILLARY_EQUIPMENT) as LeanDocument<
      IProductDocument<PRODUCT_TYPE.ANCILLARY_EQUIPMENT>
    >[];

    const softCosts = products.filter(item => item.type === PRODUCT_TYPE.SOFT_COST) as LeanDocument<
      IProductDocument<PRODUCT_TYPE.SOFT_COST>
    >[];

    const laborCosts = products.filter(item => item.type === PRODUCT_TYPE.LABOR) as LeanDocument<
      IProductDocument<PRODUCT_TYPE.LABOR>
    >[];

    adders.forEach((adder, id) => systemDesign.setAdder(adder, adder.pricingUnit, id, systemDesign.designMode));

    inverters.forEach((inverter, id) => systemDesign.setInverter(inverter, id, systemDesign.designMode));

    storages.forEach((storage, id) => systemDesign.setStorage(storage, id, systemDesign.designMode));

    balanceOfSystems.forEach((balanceOfSystems, id) =>
      systemDesign.setBalanceOfSystem(balanceOfSystems, id, systemDesign.designMode),
    );

    ancilaryEquipments.forEach((ancillaryEquipment, id) =>
      systemDesign.setAncillaryEquipment(ancillaryEquipment, id, systemDesign.designMode),
    );

    softCosts.forEach((softCost, id) => systemDesign.setSoftCost(softCost, id, systemDesign.designMode));

    laborCosts.forEach((laborCost, id) => systemDesign.setLaborCost(laborCost, id, systemDesign.designMode));

    if (systemDesignDto.roofTopDesignData) {
      const arrayGenerationKWh: number[] = [];
      let cumulativeGenerationKWh = 0;
      let cumulativeCapacityKW = 0;

      const handlers = [
        systemDesign.roofTopDesignData.panelArray.map(async (item, index) => {
          item.arrayId = Types.ObjectId.isValid(item.arrayId) ? item.arrayId : Types.ObjectId();

          const { panelModelId } = systemDesignDto.roofTopDesignData.panelArray[index];

          item.panelModelId = panelModelId;

          const panelModelData = products.find(p => p._id?.toString() === panelModelId) as LeanDocument<
            IProductDocument<PRODUCT_TYPE.MODULE>
          >;

          systemDesign.setPanelModelDataSnapshot(panelModelData, index);

          const capacity = (item.numberOfPanels * (panelModelData.ratings.watts ?? 0)) / 1000;

          const { azimuth, pitch, useSunroof, sunroofPitch, sunroofAzimuth } = item;

          const acAnnual = await this.systemProductService.pvWatCalculation({
            lat: systemDesign.latitude,
            lon: systemDesign.longitude,
            azimuth: useSunroof && sunroofAzimuth !== undefined ? sunroofAzimuth : azimuth,
            systemCapacity: capacity,
            tilt: useSunroof && sunroofPitch !== undefined ? sunroofPitch : pitch,
            losses: item.losses,
          });

          arrayGenerationKWh[index] = acAnnual;
          cumulativeGenerationKWh += acAnnual;
          cumulativeCapacityKW += capacity;
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
        arrayGenerationKWh,
        pvWattProduction: getTypicalProduction(systemProductionArray.hourly), // calculate pv watt typical production
      });

      const netUsagePostInstallation = this.systemProductService.calculateNetUsagePostSystemInstallation(
        (utilityAndUsage?.utilityData?.computedUsage?.hourlyUsage || []).map(item => item.v),
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
      const arrayGenerationKWh: number[] = [];
      let cumulativeGenerationKWh = 0;
      let cumulativeCapacityKW = 0;

      const handlers = [
        systemDesign.capacityProductionDesignData.panelArray.map(async (item, index) => {
          const { panelModelId, capacity, production, pitch, azimuth, losses } = item;
          let generation = 0;

          const panelModelData = products.find(p => p._id?.toString() === panelModelId) as LeanDocument<
            IProductDocument<PRODUCT_TYPE.MODULE>
          >;

          systemDesign.setPanelModelDataSnapshot(panelModelData, index, systemDesign.designMode);

          if (!remainArrayId) {
            const newObjectId = Types.ObjectId();

            const relatedInverterIndex =
              systemDesign.capacityProductionDesignData.inverters?.findIndex(
                inverter => inverter.arrayId === item.arrayId,
              ) ?? -1;
            if (relatedInverterIndex !== -1) {
              systemDesign.capacityProductionDesignData.inverters[relatedInverterIndex].arrayId = newObjectId;
            }
            item.arrayId = newObjectId;
          }

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

          arrayGenerationKWh[index] = capacity;
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
              arrayGenerationKWh,
            },
            index,
          );
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
        arrayGenerationKWh,
        pvWattProduction: getTypicalProduction(systemProductionArray.hourly), // calculate pv watt typical production
      });

      const netUsagePostInstallation = this.systemProductService.calculateNetUsagePostSystemInstallation(
        (utilityAndUsage?.utilityData?.computedUsage?.hourlyUsage || []).map(item => item.v),
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

    systemDesign.setSystemProductionId(foundSystemDesign.systemProductionId);

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

    const removedUndefined = await this.calculateSystemDesign({
      systemDesign,
      systemDesignDto,
      preCalculate: async () => {
        if (systemDesignDto.thumbnail) {
          const [thumbnail] = await Promise.all([
            this.s3Service.putBase64Image(
              this.SYSTEM_DESIGN_S3_BUCKET,
              systemDesignDto.thumbnail,
              'public-read',
            ) as any,
            this.s3Service.deleteObject(
              this.SYSTEM_DESIGN_S3_BUCKET,
              this.s3Service.getLocationFromUrl(foundSystemDesign.thumbnail).keyName,
            ),
          ]);
          systemDesign.setThumbnail(thumbnail);
        }
      },
    });

    delete removedUndefined?._id;

    // save newSystemProduction to systemProduction and remove it from systemDesign's props
    const newSystemProduction = { ...removedUndefined?.systemProductionData };

    delete removedUndefined?.systemProductionData;

    assignToModel(foundSystemDesign, removedUndefined);

    const [, , systemProductionUpdated] = await Promise.all([
      foundSystemDesign.save(),
      systemDesignDto.designMode &&
        this.quoteService.setOutdatedData(
          systemDesignDto.opportunityId,
          'System Design',
          foundSystemDesign._id.toString(),
        ),
      this.systemProductionService.update(systemDesign.systemProductionId, {
        ...newSystemProduction,
      }),
    ]);

    const systemDesignUpdated = foundSystemDesign.toJSON();
    if (systemProductionUpdated.data) {
      systemDesignUpdated.systemProductionData = systemProductionUpdated.data;
    }

    return OperationResult.ok(strictPlainToClass(SystemDesignDto, systemDesignUpdated));
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

    const systemDesign = new SystemDesignModel(pickBy(systemDesignDto, item => typeof item !== 'undefined') as any);

    if (id) {
      const foundSystemDesign = await this.systemDesignModel.findOne({ _id: id }).lean();

      if (!foundSystemDesign) throw ApplicationException.NotFoundStatus('System Design', id.toString());

      systemDesign.setSystemProductionId(foundSystemDesign.systemProductionId);

      const result = await this.calculateSystemDesign({ systemDesign, systemDesignDto, remainArrayId: true });

      return OperationResult.ok(
        strictPlainToClass(SystemDesignDto, {
          ...foundSystemDesign,
          ...result,
        }),
      );
    }

    const result = await this.calculateSystemDesign({ systemDesign, systemDesignDto, remainArrayId: true });

    return OperationResult.ok(strictPlainToClass(SystemDesignDto, result!));
  }

  async delete(id: ObjectId, opportunityId: string): Promise<OperationResult<string>> {
    const systemDesignId = id.toString();
    const systemDesign = await this.systemDesignModel.findOne({ _id: systemDesignId, opportunityId });
    if (!systemDesign) {
      throw ApplicationException.EntityNotFound(systemDesignId);
    }

    const checkUsedByQuote = await this.quoteService.getAllQuotes(1, 0, systemDesignId, opportunityId);
    if (checkUsedByQuote.data?.total) {
      throw new BadRequestException('This system design has been used by Quote');
    }

    const isInUsed = await this.checkInUsed(systemDesignId);

    if (isInUsed) {
      throw new BadRequestException(isInUsed);
    }

    this.systemProductionService.delete(systemDesign.systemProductionId);

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
        if (systemDesign.systemProductionId) {
          const systemProduction = await this.systemProductionService.findById(systemDesign.systemProductionId);
          systemDesign.systemProductionData = systemProduction.data;
        }
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

    const [systemProduction, isInUsed] = await Promise.all([
      this.systemProductionService.findById(foundSystemDesign.systemProductionId),
      this.checkInUsed(id.toString()),
    ]);

    // expose systemProduction's props
    if (systemProduction.data) {
      foundSystemDesign.systemProductionData = systemProduction.data;
    }

    return OperationResult.ok(
      strictPlainToClass(SystemDesignDto, {
        ...foundSystemDesign,
        editable: !isInUsed,
        editableMessage: isInUsed || null,
      } as any),
    );
  }

  async getAncillaryList(): Promise<OperationResult<Pagination<SystemDesignAncillaryMasterDto>>> {
    const res = await this.productService.getLeanManyByQuery<PRODUCT_TYPE.ANCILLARY_EQUIPMENT>({
      type: PRODUCT_TYPE.ANCILLARY_EQUIPMENT,
    });

    return OperationResult.ok(
      new Pagination({ data: strictPlainToClass(SystemDesignAncillaryMasterDto, res), total: res.length }),
    );
  }

  async updateAncillaryMaster(
    id: ObjectId,
    req: UpdateAncillaryMasterDtoReq,
  ): Promise<OperationResult<SystemDesignAncillaryMasterDto>> {
    const updatedModel = await this.productService.findByIdAndTypeAndUpdate(PRODUCT_TYPE.ANCILLARY_EQUIPMENT, id, {
      insertionRule: req.insertionRule!,
    });

    if (!updatedModel) {
      throw new NotFoundException(`No ancillary product found with id ${id.toString()}`);
    }

    return OperationResult.ok(strictPlainToClass(SystemDesignAncillaryMasterDto, updatedModel as any));
  }

  //  ->>>>>>>>>>>>>>>>>>>>>>>>> INTERNAL <<<<<<<<<<<<<<<<<<<<<<<<<<<-
  public async getOneById(id: string | ObjectId): Promise<LeanDocument<SystemDesign> | null>;

  public async getOneById(
    id: string | ObjectId,
    populateManufacturer: true,
  ): Promise<SystemDesignWithManufacturerMeta | null>;

  public async getOneById(id: string | ObjectId, populateManufacturer?: true): Promise<any> {
    const systemDesign = await this.systemDesignModel.findById(id).lean();

    if (!systemDesign) {
      return null;
    }

    if (!populateManufacturer) return systemDesign;

    const products =
      systemDesign.designMode === 'roofTop'
        ? systemDesign.roofTopDesignData
        : systemDesign.capacityProductionDesignData;

    const { ancillaryEquipments, inverters, panelArray, storage } = products;

    const manufacturerIds = uniq([
      ...ancillaryEquipments.map(item => item.ancillaryEquipmentModelDataSnapshot.manufacturerId),
      ...inverters.map(item => item.inverterModelDataSnapshot.manufacturerId),
      ...panelArray.map<any>(item => item.panelModelDataSnapshot?.manufacturerId),
      ...storage.map(item => item.storageModelDataSnapshot.manufacturerId),
    ]);

    const manufacturerNames = await this.manufacturerService.getManufacturersByIds(manufacturerIds);

    ancillaryEquipments.forEach(item => {
      attachMeta(item.ancillaryEquipmentModelDataSnapshot, {
        manufacturer: manufacturerNames.find(
          m => item.ancillaryEquipmentModelDataSnapshot.manufacturerId.toString() === m._id.toString(),
        ),
      });
    });

    inverters.forEach(item => {
      attachMeta(item.inverterModelDataSnapshot, {
        manufacturer: manufacturerNames.find(
          m => item.inverterModelDataSnapshot.manufacturerId.toString() === m._id.toString(),
        ),
      });
    });

    panelArray.forEach(item => {
      if (item.panelModelDataSnapshot)
        attachMeta(item.panelModelDataSnapshot, {
          manufacturer: manufacturerNames.find(
            m => item.panelModelDataSnapshot.manufacturerId.toString() === m._id.toString(),
          ),
        });
    });

    storage.forEach(item => {
      attachMeta(item.storageModelDataSnapshot, {
        manufacturer: manufacturerNames.find(
          m => item.storageModelDataSnapshot.manufacturerId.toString() === m._id.toString(),
        ),
      });
    });

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
        systemDesigns.map(async item => {
          const systemProduction = await this.systemProductionService.findById(item.systemProductionId);
          if (systemProduction.data) {
            this.systemProductionService.update(item.systemProductionId, {
              annualUsageKWh,
              offsetPercentage: annualUsageKWh > 0 ? systemProduction.data.generationKWh / annualUsageKWh : 0,
            });
          }
        }),
      );
    } catch (error) {
      return false;
    }

    return true;
  }

  async countByOpportunityId(opportunityId: string): Promise<number> {
    return await this.systemDesignModel.countDocuments({ opportunityId }).lean();
  }

  async handleUpdateExistingSolar(opportunityId: string, isRetrofit: boolean, existingSolarData: ExistingSolarDataDto) {
    // TODO doesn't typescript guarantee that this is a boolean?
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

  public async calculateSunroofOrientation (
    req: CalculateSunroofOrientationDto,
  ) : Promise<OperationResult<CalculateSunroofOrientationResDto>> {
    const { centerLat, centerLng, latitude, longitude, opportunityId, sideAzimuths, polygons } = req;

    // const sunroofData = await this.googleSunroofService.getClosestBuilding(opportunityId, latitude, longitude)
    //
    // if (!sunroofData) {
    //   return OperationResult.ok(strictPlainToClass(CalculateSunroofResDto, {}));
    // }
    // const sunroofPitchAndAzimuth = this.getSunroofPitchAndAzimuth(
    //   sunroofData,
    //   centerLat,
    //   centerLng,
    //   sideAzimuths,
    //   polygons,
    // );

    const orientationInformation = await this.googleSunroofService.getOrientationInformation(
      opportunityId,
      latitude,
      longitude,
      centerLat,
      centerLng,
      sideAzimuths,
      polygons,
    )

    return OperationResult.ok(strictPlainToClass(CalculateSunroofOrientationResDto, orientationInformation));
  }

  public async getSunroofBoundingBoxes(req: GetBoundingBoxesReqDto): Promise<OperationResult<GetBoundingBoxesResDto>> {
    const { latitude, longitude, opportunityId } = req;

    const sunroofData = await this.googleSunroofService.getClosestBuilding(opportunityId, latitude, longitude);

    if (!sunroofData) {
      return OperationResult.ok(strictPlainToClass(GetBoundingBoxesResDto, {}));
    }

    const boundingBoxes = sunroofData.solarPotential.roofSegmentStats.map(e => e.boundingBox);

    return OperationResult.ok(strictPlainToClass(GetBoundingBoxesResDto, { boundingBoxes }));
  }

  public calculateSystemProductionByHour(systemDesignDto: UpdateSystemDesignDto): Promise<ISystemProduction> {
    return this.systemProductService.calculateSystemProductionByHour(systemDesignDto);
  }

  // TODO delete this
  // private async getSunRoofData(
  //   lat: number,
  //   lng: number,
  //   opportunityId: string,
  // ): Promise<GoogleSunroof.Building | null> {
  //   try {
  //     return await this.googleSunroofService.getClosestBuilding(opportunityId, lat, lng)
  //
  //     // TODO fix caching with optimistic read
  //     // const fileName = `${opportunityId}/closestBuilding.json`;
  //     // const existed = await this.googleSunroofService.hasS3File(fileName);
  //     // if (!existed) {
  //     //   return await this.googleSunroofService.getBuilding(lat, lng, fileName);
  //     // }
  //     // return await this.googleSunroofService.getS3FileAsJson<GoogleSunroof.Building>(fileName);
  //   } catch (_) {
  //     console.error(_)
  //     return null;
  //   }
  // }

  // TODO delete this
  // private getSunroofPitchAndAzimuth(
  //   buildingData: GoogleSunroof.Building,
  //   centerLat: number,
  //   centerLng: number,
  //   sideAzimuths: number[],
  //   polygons: ICoordinate[],
  // ): {
  //   sunroofPrimaryOrientationSide?: number;
  //   sunroofPitch?: number;
  //   sunroofAzimuth?: number;
  // } {
  //   if (!Array.isArray(buildingData?.solarPotential?.roofSegmentStats)) {
  //     return {};
  //   }
  //
  //   const segmentsContainPanel = buildingData.solarPotential.roofSegmentStats.filter(segment =>
  //     isCoordinatesInsideBoundByAtLeast(polygons, {
  //       ne: {
  //         lat: segment.boundingBox.ne.latitude,
  //         lng: segment.boundingBox.ne.longitude,
  //       },
  //       sw: {
  //         lat: segment.boundingBox.sw.latitude,
  //         lng: segment.boundingBox.sw.longitude,
  //       },
  //     }),
  //   );
  //
  //   let closestSegment: GoogleSunroof.Building['solarPotential']['roofSegmentStats'][number];
  //
  //   if (segmentsContainPanel.length === 1) {
  //     const [segment] = segmentsContainPanel;
  //
  //     closestSegment = segment;
  //   } else
  //     closestSegment = (segmentsContainPanel.length
  //       ? segmentsContainPanel
  //       : buildingData.solarPotential.roofSegmentStats
  //     )
  //       .map(e => {
  //         const distance = calcCoordinatesDistance(
  //           {
  //             lat: centerLat,
  //             lng: centerLng,
  //           },
  //           {
  //             lat: e.center.latitude,
  //             lng: e.center.longitude,
  //           },
  //         );
  //
  //         return {
  //           ...e,
  //           distance,
  //         };
  //       })
  //       .sort((a, b) => a.distance - b.distance)[0];
  //
  //   if (!closestSegment.azimuthDegrees) {
  //     return {};
  //   }
  //
  //   const closestSide = sideAzimuths
  //     .map((e, idx) => ({
  //       side: idx + 1,
  //       val: Math.abs(closestSegment.azimuthDegrees - e),
  //     }))
  //     .sort((a, b) => a.val - b.val)[0].side;
  //
  //   return {
  //     sunroofPrimaryOrientationSide: closestSide,
  //     sunroofPitch: closestSegment.pitchDegrees,
  //     sunroofAzimuth: closestSegment.azimuthDegrees,
  //   };
  // }

  private async getAllProductsOfSystemDesign(
    systemDesignDto: UpdateSystemDesignDto,
  ): Promise<LeanDocument<IUnknownProduct>[]> {
    const productIds: string[] = [];

    if (systemDesignDto.roofTopDesignData) {
      productIds.push(...(systemDesignDto.roofTopDesignData.adders ?? []).map(e => e.adderId));
      productIds.push(...(systemDesignDto.roofTopDesignData.ancillaryEquipments ?? []).map(e => e.ancillaryId));
      productIds.push(...(systemDesignDto.roofTopDesignData.balanceOfSystems ?? []).map(e => e.balanceOfSystemId));
      productIds.push(...(systemDesignDto.roofTopDesignData.inverters ?? []).map(e => e.inverterModelId));
      productIds.push(...(systemDesignDto.roofTopDesignData.laborCosts ?? []).map(e => e.laborCostId));
      productIds.push(...(systemDesignDto.roofTopDesignData.panelArray ?? []).map(e => e.panelModelId));
      productIds.push(...(systemDesignDto.roofTopDesignData.softCosts ?? []).map(e => e.softCostId));
      productIds.push(...(systemDesignDto.roofTopDesignData.storage ?? []).map(e => e.storageModelId));
    } else {
      productIds.push(...(systemDesignDto.capacityProductionDesignData.adders ?? []).map(e => e.adderId));
      productIds.push(
        ...(systemDesignDto.capacityProductionDesignData.ancillaryEquipments ?? []).map(e => e.ancillaryId),
      );
      productIds.push(
        ...(systemDesignDto.capacityProductionDesignData.balanceOfSystems ?? []).map(e => e.balanceOfSystemId),
      );
      productIds.push(...(systemDesignDto.capacityProductionDesignData.inverters ?? []).map(e => e.inverterModelId));
      productIds.push(...(systemDesignDto.capacityProductionDesignData.laborCosts ?? []).map(e => e.laborCostId));
      productIds.push(...(systemDesignDto.capacityProductionDesignData.panelArray ?? []).map(e => e.panelModelId));
      productIds.push(...(systemDesignDto.capacityProductionDesignData.softCosts ?? []).map(e => e.softCostId));
      productIds.push(...(systemDesignDto.capacityProductionDesignData.storage ?? []).map(e => e.storageModelId));
    }

    const products = await this.productService.getDetailByIds(productIds);

    return productIds
      .map(id => products.find(e => e._id?.toString() === id))
      .filter((e): e is LeanDocument<IUnknownProduct> => !!e);
  }

  public async generateHeatmapPngs (systemDesignId: ObjectId) : Promise<OperationResult<any>> {
    const systemDesign = await this.systemDesignModel.findById(systemDesignId).lean();
    if (!systemDesign) {
      throw ApplicationException.EntityNotFound(systemDesignId.toString());
    }
    await this.googleSunroofService.generateHeatmapPngs(systemDesign)
    return OperationResult.ok();
  }

  public async generateOverlayPng (systemDesignId: ObjectId) : Promise<OperationResult<any>> {
    const systemDesign = await this.systemDesignModel.findById(systemDesignId).lean()
    if (!systemDesign) {
      throw ApplicationException.EntityNotFound(systemDesignId.toString())
    }
    await this.googleSunroofService.generateOverlayPng(systemDesign)
    return OperationResult.ok();
  }
}
