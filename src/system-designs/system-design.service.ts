/* eslint-disable no-plusplus */
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { isMongoId } from 'class-validator';
import { flatten, pickBy, range, sum, sumBy, uniq } from 'lodash';
import { LeanDocument, Model, ObjectId, Types } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination } from 'src/app/common';
import { STATUS_QUERY } from 'src/contracts/constants';
import { ContractService } from 'src/contracts/contract.service';
import { DEFAULT_ENVIRONMENTAL_LOSSES_DATA } from 'src/e-commerces/constants';
import { ECommerceService } from 'src/e-commerces/e-commerce.service';
import { REGION_PURPOSE } from 'src/e-commerces/schemas';
import { ExistingSystemService } from 'src/existing-systems/existing-system.service';
import { ExternalService } from 'src/external-services/external-service.service';
import { ManufacturerService } from 'src/manufacturers/manufacturer.service';
import { MountTypesService } from 'src/mount-types-v2/mount-types-v2.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { DEFAULT_PRODUCTION_DERATES, PRODUCTION_DERATES_NAME_MAPPER } from 'src/production-derates-v2/constants';
import { ProductionDeratesService } from 'src/production-derates-v2/production-derates-v2.service';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { IProductDocument, IUnknownProduct } from 'src/products-v2/interfaces';
import { ProductService } from 'src/products-v2/services';
import { ProposalService } from 'src/proposals/proposal.service';
import { QuotePartnerConfigService } from 'src/quote-partner-configs/quote-partner-config.service';
import { QuoteService } from 'src/quotes/quote.service';
import { AsyncContextProvider } from 'src/shared/async-context/providers/async-context.provider';
import {
  PRESIGNED_POST_URL_EXPIRES,
  PRESIGNED_POST_URL_MAX_SIZE,
  PRESIGNED_POST_URL_MIN_SIZE,
} from 'src/shared/aws/constants';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { GoogleSunroofService } from 'src/shared/google-sunroof/google-sunroof.service';
import { SystemProduction } from 'src/shared/google-sunroof/types';
import { attachMeta } from 'src/shared/mongo';
import { assignToModel } from 'src/shared/transform/assignToModel';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { IDerateSnapshot } from 'src/system-productions/system-production.schema';
import { SystemProductionService } from 'src/system-productions/system-production.service';
import { GetPinballSimulatorDto } from 'src/utilities/req';
import { UtilityUsageDetails } from 'src/utilities/utility.schema';
import { getCenterBound } from 'src/utils/calculate-coordinates';
import { buildMonthlyAndAnnualDataFrom8760, buildMonthlyHourFrom8760 } from 'src/utils/transformData';
import { transformDataToCSVFormat } from 'src/utils/transformDataToCSVFormat';
import { roundNumber } from 'src/utils/transformNumber';
import { v4 as uuidv4 } from 'uuid';
import { IAnnualBillData } from 'src/external-services/typing';
import { IExistingSystemStorage } from 'src/existing-systems/interfaces';
import { HOURLY_USAGE_PROFILE } from 'src/utilities/constants';
import { UtilityService } from '../utilities/utility.service';
import { BATTERY_PURPOSE, DESIGN_MODE, PRESIGNED_GET_URL_EXPIRE_IN } from './constants';
import { SystemDesignHook } from './providers/system-design.hook';
import {
  CalculateSunroofOrientationDto,
  CreateSystemDesignDto,
  GetBoundingBoxesReqDto,
  UpdateAncillaryMasterDtoReq,
  UpdateSystemDesignDto,
} from './req';
import { RoofTopImageReqDto } from './req/sub-dto/roof-top-image.dto';
import {
  CalculateSunroofOrientationResDto,
  CalculateSunroofProductionResDto,
  CalculateSystemActualProductionResDto,
  GetArrayOverlaySignedUrlResDto,
  GetBoundingBoxesResDto,
  GetHeatmapSignedUrlsResDto,
  ProductionDeratesDesignSystemDto,
  SystemDesignAncillaryMasterDto,
  SystemDesignDto,
} from './res';
import { GetPresignedPostUrlResDto } from './res/get-presigned-post-url.dto';
import { CsvExportResDto } from './res/sub-dto/csv-export-res.dto';
import { ISystemProduction, SunroofHourlyProductionCalculation, SystemProductService } from './sub-services';
import {
  IRoofTopSchema,
  SystemDesign,
  SystemDesignModel,
  SystemDesignWithManufacturerMeta,
  SYSTEM_DESIGN,
} from './system-design.schema';
import { IProductionDeratesData } from './typing';

@Injectable()
export class SystemDesignService {
  private SYSTEM_DESIGN_S3_BUCKET = process.env.AWS_S3_BUCKET as string;

  private PINBALL_SIMULATION_BUCKET = process.env.AWS_S3_PINBALL_SIMULATION as string;

  private GOOGLE_SUNROOF_BUCKET = process.env.GOOGLE_SUNROOF_S3_BUCKET as string;

  constructor(
    // @ts-ignore
    @Inject(SYSTEM_DESIGN) private readonly systemDesignModel: Model<SystemDesign>,
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
    private readonly systemProductionService: SystemProductionService,
    private readonly systemDesignHook: SystemDesignHook,
    private readonly asyncContext: AsyncContextProvider,
    private readonly existingSystem: ExistingSystemService,
    private readonly eCommerceService: ECommerceService,
    private readonly sunroofHourlyProductionCalculation: SunroofHourlyProductionCalculation,
    private readonly productionDeratesService: ProductionDeratesService,
    private readonly mountTypesService: MountTypesService,
    private readonly externalService: ExternalService,
  ) {}

  async create(systemDesignDto: CreateSystemDesignDto): Promise<OperationResult<SystemDesignDto>> {
    if (!systemDesignDto.roofTopDesignData && !systemDesignDto.capacityProductionDesignData) {
      throw new Error('Please put your data in body');
    }

    if (
      (systemDesignDto.roofTopDesignData &&
        !systemDesignDto.roofTopDesignData.roofTopImage &&
        !systemDesignDto.roofTopDesignData?.panelArray.length &&
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

    if (!utilityAndUsage) {
      throw ApplicationException.EntityNotFound(systemDesign.opportunityId);
    }

    const annualUsageKWh =
      utilityAndUsage?.utilityData.plannedProfile?.annualUsage ??
      (utilityAndUsage?.utilityData.computedUsage?.annualConsumption || 0);
    const totalPlannedUsageIncreases = utilityAndUsage?.totalPlannedUsageIncreases || 0;

    const arrayGenerationKWh: number[] = [];
    let cumulativeGenerationKWh = 0;
    let cumulativeCapacityKW = 0;

    if (systemDesign.designMode === DESIGN_MODE.ROOF_TOP) {
      const handlers: Promise<unknown>[] = [this.googleSunroofService.isExistedGeotiff(systemDesign)];
      // a system has only one module
      if (systemDesign.roofTopDesignData?.panelArray.length) {
        handlers.push(
          this.productService.getDetailByIdAndType(
            PRODUCT_TYPE.MODULE,
            systemDesign.roofTopDesignData.panelArray[0]?.panelModelId,
          ),
        );
      }
      const [hasSunroofIrradiance, panelModelData] = <[boolean, LeanDocument<IProductDocument<PRODUCT_TYPE.MODULE>>]>(
        await Promise.all(handlers)
      );

      systemDesign.roofTopDesignData.hasSunroofIrradiance = hasSunroofIrradiance;

      const [thumbnail] = await Promise.all(
        flatten([
          this.s3Service.putBase64Image(this.SYSTEM_DESIGN_S3_BUCKET, systemDesignDto.thumbnail, 'public-read') as any,
          systemDesign.roofTopDesignData.panelArray.map(async (item, index) => {
            const isObjectIdValid = Types.ObjectId.isValid(item.arrayId);
            item.arrayId = isObjectIdValid ? item.arrayId : Types.ObjectId();
            if (!isObjectIdValid) item.useSunroof = hasSunroofIrradiance;

            const {
              numberOfPanels,
              azimuth,
              pitch,
              overrideRooftopDetails,
              sunroofAzimuth,
              sunroofPitch,
              sunroofPrimaryOrientationSide,
            } = item;

            systemDesign.roofTopDesignData.panelArray[index].hasSunroofRooftop = [
              sunroofAzimuth,
              sunroofPitch,
              sunroofPrimaryOrientationSide,
            ].every(e => e !== undefined);

            const hasSunroofRooftop = systemDesign.roofTopDesignData.panelArray[index].hasSunroofRooftop;

            const capacity = (numberOfPanels * (panelModelData.ratings.watts ?? 0)) / 1000;
            // TODO: is this duplicated with systemProductionArray
            const acAnnual = await this.systemProductService.pvWatCalculation({
              lat: systemDesign.latitude,
              lon: systemDesign.longitude,
              azimuth: !overrideRooftopDetails && hasSunroofRooftop !== undefined ? sunroofAzimuth! : azimuth,
              systemCapacity: capacity,
              tilt: !overrideRooftopDetails && hasSunroofRooftop !== undefined ? sunroofPitch : pitch,
              losses: item.losses,
            });

            arrayGenerationKWh[index] = acAnnual;
            cumulativeGenerationKWh += acAnnual;
            cumulativeCapacityKW += capacity;

            systemDesign.setPanelModelDataSnapshot(panelModelData, index);
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
                offsetPercentage: totalPlannedUsageIncreases > 0 ? generation / totalPlannedUsageIncreases : 0,
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

    // existingPV
    const existingSystemProduction = await this.utilityService.getExistingSystemProductionByOpportunityId(
      systemDesignDto.opportunityId,
      true,
    );
    const annualExistingPVInKWh = existingSystemProduction.annualProduction;
    const monthlyExistingPVInKWh = existingSystemProduction.monthlyProduction.map(({ v }) => v);

    const { adjustedUsageProfile } = utilityAndUsage.utilityData;

    let offsetPercentage = totalPlannedUsageIncreases > 0 ? cumulativeGenerationKWh / totalPlannedUsageIncreases : 0;

    const annualTotalPV = cumulativeGenerationKWh + annualExistingPVInKWh; // newPV + existingPV
    const monthlyTotalPV = systemProductionArray.monthly.map((v, i) => v + (monthlyExistingPVInKWh[i] || 0)); // systemProductionArray (newPV) + existingPV

    // handle backward compatibility
    if (adjustedUsageProfile) {
      const annualAdjustedUsageProfile = adjustedUsageProfile.annualUsage;
      offsetPercentage = annualTotalPV / annualAdjustedUsageProfile;
    }

    // create systemProduction then save only systemProduction.id to current systemDesign
    const newSystemProduction = await this.systemProductionService.create({
      capacityKW: cumulativeCapacityKW,
      generationKWh: cumulativeGenerationKWh,
      productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
      annualUsageKWh,
      offsetPercentage, // offsetPercentage = totalPV / adjustedUsageProfile
      generationMonthlyKWh: monthlyTotalPV, // monthlyTotalPV
      arrayGenerationKWh,
      pvWattProduction: buildMonthlyAndAnnualDataFrom8760(systemProductionArray.hourly), // calculate pv watt production typical
    });

    if (newSystemProduction.data) {
      systemDesign.systemProductionId = newSystemProduction.data.id;
    }

    const createdSystemDesign = new this.systemDesignModel(systemDesign);

    const newSystemDesign = (await createdSystemDesign.save()).toJSON();

    const derateSnapshot = await this.updateDerateSnapshot(newSystemDesign);

    // expose systemProduction's props
    if (newSystemProduction.data) {
      newSystemProduction.data.derateSnapshot = derateSnapshot;
      newSystemDesign.systemProductionData = newSystemProduction.data;
    }

    // expose rooftop image URL
    const imageURL = await this.getPresignedGetURLOfRooftopImage(newSystemDesign);

    return OperationResult.ok(strictPlainToClass(SystemDesignDto, { ...newSystemDesign, imageURL }));
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

    if (!utilityAndUsage) {
      throw ApplicationException.EntityNotFound(systemDesign.opportunityId);
    }

    const systemProductionArray = await this.systemProductService.calculateSystemProductionByHour(
      systemDesignDto,
      products,
    );

    const annualUsageKWh =
      utilityAndUsage?.utilityData.plannedProfile?.annualUsage ??
      (utilityAndUsage?.utilityData.computedUsage?.annualConsumption || 0);
    const totalPlannedUsageIncreases = utilityAndUsage?.totalPlannedUsageIncreases || 0;

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

      const _handlers: Promise<unknown>[] = [this.googleSunroofService.isExistedGeotiff(systemDesign)];
      // a system has only one module
      if (systemDesign.roofTopDesignData?.panelArray.length) {
        _handlers.push(
          this.productService.getDetailByIdAndType(
            PRODUCT_TYPE.MODULE,
            systemDesign.roofTopDesignData.panelArray[0]?.panelModelId,
          ),
        );
      }
      const [hasSunroofIrradiance, panelModelData] = <[boolean, LeanDocument<IProductDocument<PRODUCT_TYPE.MODULE>>]>(
        await Promise.all(_handlers)
      );

      systemDesign.roofTopDesignData.hasSunroofIrradiance = hasSunroofIrradiance;

      const handlers = [
        systemDesign.roofTopDesignData.panelArray.map(async (item, index) => {
          item.arrayId = Types.ObjectId.isValid(item.arrayId) ? item.arrayId : Types.ObjectId();
          if (!hasSunroofIrradiance) item.useSunroof = hasSunroofIrradiance;

          const {
            numberOfPanels,
            azimuth,
            pitch,
            overrideRooftopDetails,
            sunroofPitch,
            sunroofAzimuth,
            sunroofPrimaryOrientationSide,
          } = item;

          systemDesign.roofTopDesignData.panelArray[index].hasSunroofRooftop = [
            sunroofAzimuth,
            sunroofPitch,
            sunroofPrimaryOrientationSide,
          ].every(e => e !== undefined);

          const hasSunroofRooftop = systemDesign.roofTopDesignData.panelArray[index].hasSunroofRooftop;

          const capacity = (numberOfPanels * (panelModelData.ratings.watts ?? 0)) / 1000;

          const acAnnual = await this.systemProductService.pvWatCalculation({
            lat: systemDesign.latitude,
            lon: systemDesign.longitude,
            azimuth: !overrideRooftopDetails && hasSunroofRooftop !== undefined ? sunroofAzimuth! : azimuth,
            systemCapacity: capacity,
            tilt: !overrideRooftopDetails && sunroofPitch !== undefined ? sunroofPitch : pitch,
            losses: item.losses,
          });

          arrayGenerationKWh[index] = acAnnual;
          cumulativeGenerationKWh += acAnnual;
          cumulativeCapacityKW += capacity;

          systemDesign.setPanelModelDataSnapshot(panelModelData, index);
        }),
      ];

      if (extendCalculate) {
        handlers.unshift(extendCalculate() as any);
      }

      const result = await Promise.all(flatten(handlers));

      if (extendCalculate && postExtendCalculate) {
        postExtendCalculate(result as any);
      }

      // existingPV
      const existingSystemProduction = await this.utilityService.getExistingSystemProductionByOpportunityId(
        systemDesignDto.opportunityId,
        true,
      );
      const annualExistingPVInKWh = existingSystemProduction.annualProduction;
      const monthlyExistingPVInKWh = existingSystemProduction.monthlyProduction.map(({ v }) => v);

      const { adjustedUsageProfile } = utilityAndUsage.utilityData;

      let offsetPercentage = totalPlannedUsageIncreases > 0 ? cumulativeGenerationKWh / totalPlannedUsageIncreases : 0;

      const annualTotalPV = cumulativeGenerationKWh + annualExistingPVInKWh; // newPV + existingPV
      const monthlyTotalPV = systemProductionArray.monthly.map((v, i) => v + (monthlyExistingPVInKWh[i] || 0)); // systemProductionArray (newPV) + existingPV

      // handle backward compatibility
      if (adjustedUsageProfile) {
        const annualAdjustedUsageProfile = adjustedUsageProfile.annualUsage;
        offsetPercentage = annualTotalPV / annualAdjustedUsageProfile;
      }

      systemDesign.setSystemProductionData({
        capacityKW: cumulativeCapacityKW,
        generationKWh: cumulativeGenerationKWh,
        productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
        annualUsageKWh,
        offsetPercentage, // offsetPercentage = totalPV / adjustedUsageProfile
        generationMonthlyKWh: monthlyTotalPV, // monthlyTotalPV
        arrayGenerationKWh,
        pvWattProduction: buildMonthlyAndAnnualDataFrom8760(systemProductionArray.hourly),
      });

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
              offsetPercentage: totalPlannedUsageIncreases > 0 ? generation / totalPlannedUsageIncreases : 0,
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
        offsetPercentage: totalPlannedUsageIncreases > 0 ? cumulativeGenerationKWh / totalPlannedUsageIncreases : 0,
        generationMonthlyKWh: systemProductionArray.monthly,
        arrayGenerationKWh,
        pvWattProduction: buildMonthlyAndAnnualDataFrom8760(systemProductionArray.hourly), // calculate pv watt typical production
      });

      if (dispatch) {
        await dispatch(systemDesign);
      }

      return pickBy(systemDesign, item => typeof item !== 'undefined');
    }

    return pickBy(systemDesign, item => typeof item !== 'undefined');
  }

  async updateDerateSnapshot(systemDesign: LeanDocument<SystemDesign> | SystemDesignModel): Promise<IDerateSnapshot> {
    const { systemProductionId, opportunityId } = systemDesign;

    const [productionDerates, soilingLosses, snowLosses] = await Promise.all([
      this.productionDeratesService.getAllProductionDerates(),
      this.eCommerceService.getEnvironmentalLosses(opportunityId, REGION_PURPOSE.SOILING),
      this.eCommerceService.getEnvironmentalLosses(opportunityId, REGION_PURPOSE.SNOW),
    ]);

    const productionLosses = { ...DEFAULT_PRODUCTION_DERATES };

    productionDerates.data?.forEach(({ name, amount }) => {
      const existedProductionDerate = PRODUCTION_DERATES_NAME_MAPPER[name];

      if (!existedProductionDerate) {
        return;
      }

      productionLosses[existedProductionDerate] = amount;
    });

    const updatedSystemProduction = await this.systemProductionService.update(systemProductionId, {
      derateSnapshot: {
        ...productionLosses,
        soilingLosses,
        snowLosses,
      },
    });

    return updatedSystemProduction.data?.derateSnapshot as IDerateSnapshot;
  }

  async update(id: ObjectId, systemDesignDto: UpdateSystemDesignDto): Promise<OperationResult<SystemDesignDto>> {
    if (
      systemDesignDto.capacityProductionDesignData &&
      !systemDesignDto.capacityProductionDesignData.panelArray.length &&
      !systemDesignDto.capacityProductionDesignData.inverters.length
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
    // TODO: refactor - replace inside system-design-hook
    const newSystemProduction = { ...removedUndefined?.systemProductionData };

    delete removedUndefined?.systemProductionData;

    assignToModel(foundSystemDesign, removedUndefined);

    if (
      (systemDesignDto.existingSystemId && !foundSystemDesign.existingSystem) ||
      (systemDesignDto.existingSystemId &&
        foundSystemDesign.existingSystem?.id.toString() !== systemDesignDto.existingSystemId)
    ) {
      const existingSystem = await this.existingSystem.findOrFail(
        (Types.ObjectId(systemDesignDto.existingSystemId) as unknown) as ObjectId,
      );
      foundSystemDesign.existingSystem = existingSystem;
    }

    if (!systemDesignDto.existingSystemId && foundSystemDesign.existingSystem) {
      foundSystemDesign.existingSystem = undefined;
    }

    const handlers: Promise<unknown>[] = [foundSystemDesign.save()];

    if (systemDesignDto.designMode) {
      handlers.push(
        this.quoteService.setOutdatedData(
          systemDesignDto.opportunityId,
          'System Design',
          foundSystemDesign._id.toString(),
        ),
      );
    }

    handlers.push(
      this.systemProductionService.update(systemDesign.systemProductionId, {
        ...newSystemProduction,
      }),
    );

    handlers.push(this.updateDerateSnapshot(systemDesign));

    await Promise.all(handlers);

    this.systemDesignHook.queueGenerateSunroofProduction(this.asyncContext.UNSAFE_getStore()!, foundSystemDesign);

    const systemDesignUpdated = foundSystemDesign.toJSON();

    // expose rooftop image URL
    const imageURL = await this.getPresignedGetURLOfRooftopImage(systemDesignUpdated);

    return OperationResult.ok(
      strictPlainToClass(SystemDesignDto, {
        ...systemDesignUpdated,
        systemProductionData: newSystemProduction,
        imageURL,
      }),
    );
  }

  async updateArchiveStatus(
    systemDesignId: ObjectId,
    body: { isArchived: boolean },
  ): Promise<OperationResult<SystemDesignDto>> {
    const foundSystemDesign = await this.systemDesignModel.findById(systemDesignId);

    if (!foundSystemDesign) {
      throw ApplicationException.EntityNotFound(systemDesignId.toString());
    }

    const { opportunityId } = foundSystemDesign;

    const { isSentProposalsExisted, isContractsExisted } = await this.checkSentProposalOrGeneratedContract(
      foundSystemDesign,
    );

    if (isSentProposalsExisted || isContractsExisted) {
      throw new BadRequestException('This system design has sent proposal or contract');
    }

    const { isArchived } = body;

    foundSystemDesign.isArchived = isArchived;

    await foundSystemDesign.save();

    if (isArchived) {
      const foundQuotes = await this.quoteService.getQuotesByCondition({
        systemDesignId: systemDesignId.toString(),
        opportunityId,
        isArchived: false,
      });

      if (foundQuotes.length) {
        const checkedQuotes = await Promise.all(
          foundQuotes.map(async quote => {
            const isInUsed = await this.quoteService.checkInUsed(quote._id.toString());
            return { ...quote, isInUsed };
          }),
        );

        const filteredQuotes = checkedQuotes.filter(({ isInUsed }) => !isInUsed);

        if (filteredQuotes.length) {
          await this.quoteService.updateQuotesByCondition(
            { _id: { $in: filteredQuotes.map(({ _id }) => _id) } },
            { isArchived: true },
          );
        }
      }
    }
    const [imageURL, systemProduction] = await Promise.all([
      this.getPresignedGetURLOfRooftopImage(foundSystemDesign),
      this.systemProductionService.findById(foundSystemDesign.systemProductionId),
    ]);

    return OperationResult.ok(
      strictPlainToClass(SystemDesignDto, {
        ...foundSystemDesign.toJSON(),
        systemProductionData: systemProduction.data,
        imageURL,
      }),
    );
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
      !systemDesignDto.roofTopDesignData.roofTopImage &&
      !systemDesignDto.roofTopDesignData?.panelArray.length &&
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

      const imageURL = await this.getPresignedGetURLOfRooftopImage(result);

      return OperationResult.ok(
        strictPlainToClass(SystemDesignDto, {
          ...foundSystemDesign,
          ...result,
          imageURL,
        }),
      );
    }

    const result = await this.calculateSystemDesign({ systemDesign, systemDesignDto, remainArrayId: true });

    const imageURL = await result;

    return OperationResult.ok(strictPlainToClass(SystemDesignDto, { ...result!, imageURL }));
  }

  async delete(id: ObjectId, opportunityId: string): Promise<OperationResult<string>> {
    const systemDesignId = id.toString();
    const systemDesign = await this.systemDesignModel.findOne({ _id: systemDesignId, opportunityId });
    if (!systemDesign) {
      throw ApplicationException.EntityNotFound(systemDesignId);
    }

    const checkUsedByQuote = await this.quoteService.getAllQuotes(
      1,
      0,
      systemDesignId,
      opportunityId,
      STATUS_QUERY.ALL,
    );
    if (checkUsedByQuote.data?.total) {
      throw new BadRequestException('This system design has been used by Quote');
    }

    const isInUsed = await this.checkInUsed(systemDesignId);

    if (isInUsed) {
      throw new BadRequestException(isInUsed);
    }

    this.systemProductionService.delete(systemDesign.systemProductionId);

    await systemDesign.deleteOne();

    Promise.all([
      this.s3Service.deleteDirectory(this.PINBALL_SIMULATION_BUCKET, systemDesignId),
      this.s3Service.deleteDirectory(this.GOOGLE_SUNROOF_BUCKET, `${opportunityId}/${systemDesignId}`),
    ]).catch(_ => {
      // Do not thing, any error, such as NoSuchKey (file not found)
    });

    return OperationResult.ok('Deleted Successfully');
  }

  async getAllSystemDesigns(
    limit: number,
    skip: number,
    opportunityId: string,
    status: string | undefined,
  ): Promise<OperationResult<Pagination<SystemDesignDto>>> {
    let query = {};
    switch (status) {
      case 'active':
        query = {
          isArchived: {
            $ne: true,
          },
        };
        break;
      case 'archived':
        query = {
          isArchived: true,
        };
        break;
      default:
        break;
    }
    const [systemDesigns, count] = await Promise.all([
      this.systemDesignModel
        .find({ opportunityId, ...query })
        .limit(limit)
        .skip(skip)
        .lean(),
      this.systemDesignModel.countDocuments({ opportunityId, ...query }).lean(),
    ]);

    const checkedSystemDesigns = await Promise.all(
      systemDesigns.map(async systemDesign => {
        const isInUsed = await this.checkInUsed(systemDesign._id.toString());
        if (systemDesign.systemProductionId) {
          const systemProduction = await this.systemProductionService.findById(systemDesign.systemProductionId);
          systemDesign.systemProductionData = systemProduction.data;
        }

        const { isSentProposalsExisted, isContractsExisted } = await this.checkSentProposalOrGeneratedContract(
          systemDesign,
        );

        const imageURL = await this.getPresignedGetURLOfRooftopImage(systemDesign);

        return {
          ...systemDesign,
          editable: !isInUsed,
          editableMessage: isInUsed || null,
          isSentProposalsExisted,
          isContractsExisted,
          imageURL,
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
    if (!systemProduction.data) {
      throw ApplicationException.EntityNotFound(`with systemProduction ${foundSystemDesign.systemProductionId} `);
    }
    foundSystemDesign.systemProductionData = systemProduction.data;

    // expose rooftop image URL
    const imageURL = await this.getPresignedGetURLOfRooftopImage(foundSystemDesign);

    return OperationResult.ok(
      strictPlainToClass(SystemDesignDto, {
        ...foundSystemDesign,
        editable: !isInUsed,
        editableMessage: isInUsed || null,
        imageURL,
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
    const [systemDesigns, utilityAndUsage] = await Promise.all([
      this.systemDesignModel.find({ opportunityId }),
      this.utilityService.getUtilityByOpportunityId(opportunityId),
    ]);

    if (!utilityAndUsage) {
      throw ApplicationException.EntityNotFound(opportunityId);
    }

    const totalPlannedUsageIncreases = utilityAndUsage?.totalPlannedUsageIncreases || 0;

    const existingSystemProduction = await this.utilityService.getExistingSystemProductionByOpportunityId(
      opportunityId,
      true,
    );
    const annualExistingPVKWh = existingSystemProduction.annualProduction;

    const { adjustedUsageProfile } = utilityAndUsage.utilityData;

    try {
      await Promise.all(
        systemDesigns.map(async item => {
          const systemProduction = await this.systemProductionService.findById(item.systemProductionId);
          if (!systemProduction.data) {
            throw ApplicationException.EntityNotFound(`with systemProduction ${item.systemProductionId} `);
          }
          const { generationKWh } = systemProduction.data;

          const annualTotalPV = generationKWh + annualExistingPVKWh;

          let offsetPercentage =
            totalPlannedUsageIncreases > 0 ? systemProduction.data.generationKWh / totalPlannedUsageIncreases : 0;

          // handle backward compatibility
          if (adjustedUsageProfile) {
            const annualAdjustedUsageProfile = adjustedUsageProfile.annualUsage;
            offsetPercentage = annualTotalPV / annualAdjustedUsageProfile;
          }

          this.systemProductionService.update(item.systemProductionId, {
            annualUsageKWh,
            offsetPercentage,
          });
        }),
      );
    } catch (error) {
      return false;
    }

    return true;
  }

  async countByOpportunityId(opportunityId: string): Promise<number> {
    return this.systemDesignModel.countDocuments({ opportunityId }).lean();
  }

  async countActiveDocumentsByOpportunityId(opportunityId: string): Promise<number> {
    return this.systemDesignModel
      .find({
        opportunity_id: opportunityId,
        is_archived: false,
      })
      .count();
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

  public async calculateSunroofOrientation(
    req: CalculateSunroofOrientationDto,
  ): Promise<OperationResult<CalculateSunroofOrientationResDto>> {
    const {
      centerLat: _centerLat,
      centerLng: _centerLng,
      opportunityId,
      sideAzimuths,
      polygons,
      arrayId,
      systemDesignId,
    } = req;

    let centerLat = _centerLat;
    let centerLng = _centerLng;

    if (systemDesignId && isMongoId(systemDesignId)) {
      const systemDesign = await this.getOneById(systemDesignId);

      if (!systemDesign) throw ApplicationException.EntityNotFound(systemDesignId.toString());

      if (isMongoId(arrayId)) {
        const foundPanel =
          systemDesign.roofTopDesignData &&
          systemDesign.roofTopDesignData?.panelArray.find(item => item.arrayId.toString() === arrayId);

        if (!foundPanel)
          throw new NotFoundException(`No panel found with id ${arrayId} in system design ${systemDesignId}`);

        const { lat, lng } = getCenterBound(foundPanel.boundPolygon);

        centerLat = lat;
        centerLng = lng;
      }
    }

    const orientationInformation = await this.googleSunroofService.getOrientationInformation(
      GoogleSunroofService.BuildClosestBuildingKey(opportunityId, systemDesignId, arrayId, centerLat, centerLng),
      centerLat!,
      centerLng!,
      sideAzimuths,
      polygons,
    );

    return OperationResult.ok(strictPlainToClass(CalculateSunroofOrientationResDto, orientationInformation));
  }

  public async getSunroofBoundingBoxes(req: GetBoundingBoxesReqDto): Promise<OperationResult<GetBoundingBoxesResDto>> {
    const { systemDesignId, arrayId, opportunityId, sideAzimuths } = req;

    const systemDesign = await this.getOneById(systemDesignId);

    if (!systemDesign) throw ApplicationException.EntityNotFound(systemDesignId);

    const foundPanel =
      systemDesign.roofTopDesignData &&
      systemDesign.roofTopDesignData.panelArray.find(item => item.arrayId.toString() === arrayId);

    if (!foundPanel)
      throw new NotFoundException(`No panel found with id ${arrayId} in system design ${systemDesignId}`);

    const { lat, lng } = getCenterBound(foundPanel.boundPolygon);

    const sunroofData = await this.googleSunroofService.getClosestBuilding(
      GoogleSunroofService.BuildClosestBuildingKey(opportunityId, systemDesignId, arrayId),
      lat,
      lng,
    );

    if (!sunroofData) {
      return OperationResult.ok(strictPlainToClass(GetBoundingBoxesResDto, {}));
    }

    const boundingBoxes = this.googleSunroofService.formatRoofSegmentStats(
      sunroofData.solarPotential.roofSegmentStats,
      sideAzimuths,
    );

    return OperationResult.ok(strictPlainToClass(GetBoundingBoxesResDto, { boundingBoxes }));
  }

  public calculateSystemProductionByHour(
    systemDesignDto: UpdateSystemDesignDto | SystemDesign | LeanDocument<SystemDesign>,
  ): Promise<ISystemProduction> {
    return this.systemProductService.calculateSystemProductionByHour(systemDesignDto);
  }

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

  private async getSignedUrls(pngs: string[]): Promise<string[]> {
    return Promise.all(
      pngs.map(e =>
        this.s3Service.getPresignedGetUrl(process.env.GOOGLE_SUNROOF_S3_BUCKET!, e, PRESIGNED_GET_URL_EXPIRE_IN, true),
      ),
    );
  }

  public async getHeatmapSignedUrls(systemDesignId: ObjectId): Promise<OperationResult<GetHeatmapSignedUrlsResDto>> {
    const systemDesign = await this.systemDesignModel.findById(systemDesignId).lean();
    if (!systemDesign) {
      throw ApplicationException.EntityNotFound(systemDesignId.toString());
    }

    const systemDesignIdStr = systemDesignId.toString();
    const { opportunityId } = systemDesign;

    const noHeatmapPngs = [`${opportunityId}/${systemDesignIdStr}/png/satellite.png`];

    const heatmapAnnualPngs = [`${opportunityId}/${systemDesignIdStr}/png/heatmap.annual.masked.png`];

    const heatmapsMonthlyPngs: string[] = [];
    heatmapsMonthlyPngs.push(
      ...Array.from(
        { length: 12 },
        (_, monthIndex) => `${opportunityId}/${systemDesignIdStr}/png/heatmap.month${monthIndex}.masked.png`,
      ),
    );

    const fullHeatmapAnnualPngs = [`${opportunityId}/${systemDesignIdStr}/png/heatmap.annual.png`];

    const fullHeatmapsMonthlyPngs: string[] = [];
    fullHeatmapsMonthlyPngs.push(
      ...Array.from(
        { length: 12 },
        (_, monthIndex) => `${opportunityId}/${systemDesignIdStr}/png/heatmap.month${monthIndex}.png`,
      ),
    );

    const rooftopMarkPngs = [`${opportunityId}/${systemDesignIdStr}/png/mask.png`];

    // indicate if old data has no png generated then generate new pngs before signing url
    const [first] = heatmapAnnualPngs;

    const firstExist = await this.s3Service.hasFile(process.env.GOOGLE_SUNROOF_S3_BUCKET!, first);

    if (!firstExist) {
      await this.googleSunroofService.generateHeatmapPngs(systemDesign);
    }

    const [
      noHeatmapUrls,
      heatmapAnnualUrls,
      heatmapsMonthlyUrls,
      fullHeatmapAnnualUrls,
      fullHeatmapsMonthlyUrls,
      rooftopMarkUrls,
    ] = await Promise.all([
      this.getSignedUrls(noHeatmapPngs),
      this.getSignedUrls(heatmapAnnualPngs),
      this.getSignedUrls(heatmapsMonthlyPngs),
      this.getSignedUrls(fullHeatmapAnnualPngs),
      this.getSignedUrls(fullHeatmapsMonthlyPngs),
      this.getSignedUrls(rooftopMarkPngs),
    ]);

    return OperationResult.ok(
      strictPlainToClass(GetHeatmapSignedUrlsResDto, {
        noHeatmapUrls,
        heatmapAnnualUrls,
        heatmapsMonthlyUrls,
        fullHeatmapAnnualUrls,
        fullHeatmapsMonthlyUrls,
        rooftopMarkUrls,
      }),
    );
  }

  public async getArrayOverlayPng(systemDesignId: ObjectId): Promise<OperationResult<GetArrayOverlaySignedUrlResDto>> {
    const systemDesign = await this.systemDesignModel.findById(systemDesignId).lean();
    if (!systemDesign) {
      throw ApplicationException.EntityNotFound(systemDesignId.toString());
    }

    const { opportunityId } = systemDesign;

    const systemDesignIdStr = systemDesignId.toString();

    const key = `${opportunityId}/${systemDesignIdStr}/png/array.overlay.png`;

    const exist = await this.s3Service.hasFile(process.env.GOOGLE_SUNROOF_S3_BUCKET!, key);

    if (!exist) {
      await this.googleSunroofService.generateArrayOverlayPng(systemDesign);
    }

    const signedUrl = await this.s3Service.getPresignedGetUrl(
      process.env.GOOGLE_SUNROOF_S3_BUCKET!,
      key,
      PRESIGNED_GET_URL_EXPIRE_IN,
      true,
    );

    return OperationResult.ok(strictPlainToClass(GetArrayOverlaySignedUrlResDto, { url: signedUrl }));
  }

  public async generateArrayOverlayPng(systemDesignId: ObjectId): Promise<OperationResult<any>> {
    const systemDesign = await this.systemDesignModel.findById(systemDesignId).lean();
    if (!systemDesign) {
      throw ApplicationException.EntityNotFound(systemDesignId.toString());
    }
    await this.googleSunroofService.generateArrayOverlayPng(systemDesign);
    return OperationResult.ok();
  }

  public async calculateSunroofProduction(
    systemDesignId: ObjectId,
  ): Promise<OperationResult<CalculateSunroofProductionResDto>> {
    const systemDesign = await this.systemDesignModel.findById(systemDesignId).lean();
    if (!systemDesign) {
      throw ApplicationException.EntityNotFound(systemDesignId.toString());
    }
    const systemProduction = await this.googleSunroofService.calculateProduction(systemDesign);
    return OperationResult.ok(strictPlainToClass(CalculateSunroofProductionResDto, systemProduction));
  }

  public async updateSystemDesignThumbnail(
    systemDesignId: ObjectId,
    imageStream: NodeJS.ReadableStream,
  ): Promise<void> {
    const foundSystemDesign = await this.systemDesignModel.findById(systemDesignId);

    if (!foundSystemDesign) {
      throw new NotFoundException(`No system design found with id ${systemDesignId}`);
    }

    const key = `${foundSystemDesign.opportunityId}/${foundSystemDesign._id.toString()}.png`;
    const url = await this.s3Service.putStreamPromise(
      imageStream,
      key,
      this.SYSTEM_DESIGN_S3_BUCKET,
      'image/png',
      'public-read',
    );

    if (!url) throw new InternalServerErrorException();

    await this.systemDesignModel.updateOne(
      {
        _id: systemDesignId,
      },
      {
        thumbnail: url.Location,
      },
    );
  }

  public async invokePINBALLSimulator(systemDesign: SystemDesign, systemActualProduction8760: number[]) {
    const utility = await this.utilityService.getUtilityByOpportunityId(systemDesign.opportunityId);

    if (!utility) {
      throw ApplicationException.EntityNotFound(systemDesign.opportunityId);
    }

    const medicalBaselineAmount = utility.medicalBaselineAmount;
    const isLowIncomeOrDac = utility.isLowIncomeOrDac;

    const masterTariffId = utility.costData.postInstallMasterTariffId;

    const pinballInputData = await this.buildPinballInputData(systemDesign, systemActualProduction8760, utility);

    const simulatePinballData = await this.utilityService.simulatePinball(pinballInputData);

    // save simulatePinballData to s3
    const savePinballToS3Requests = [
      'postInstallSiteDemandSeries',
      'batteryStoredEnergySeries',
      'batteryChargingSeries',
      'batteryDischargingSeries',
      'rateAmountHourly',
    ].map(series =>
      this.s3Service.putObject(
        this.PINBALL_SIMULATION_BUCKET,
        `${systemDesign.id}/${series}`,
        JSON.stringify(simulatePinballData[series]),
        'application/json; charset=utf-8',
      ),
    );

    const [annualPostInstallBill] = await Promise.all([
      this.externalService.calculateAnnualBill({
        hourlyDataForTheYear: simulatePinballData.postInstallSiteDemandSeries.map(i => i / 1000), // Wh -> KWh
        masterTariffId,
        zipCode: utility.utilityData.typicalBaselineUsage.zipCode,
        medicalBaselineAmount,
        isLowIncomeOrDac,
      }),
      ...savePinballToS3Requests,
    ]);

    const { annualCost: annualPostInstallCost, fromDateTime, toDateTime } = annualPostInstallBill as IAnnualBillData;

    // update systemDesign
    const setData: any = {
      costPostInstallation: annualPostInstallCost,
      costCalculationInput: {
        masterTariffId,
        medicalBaselineAmount,
        fromDateTime,
        toDateTime,
        isLowIncomeOrDac,
      },
    };
    const unsetData: any = {};

    if (simulatePinballData.chargingLogicType) {
      setData.pinballChargingLogicType = simulatePinballData.chargingLogicType;
    } else {
      unsetData.pinballChargingLogicType = '';
    }

    this.systemDesignModel
      .findOneAndUpdate(
        { _id: systemDesign.id },
        {
          $set: setData,
          $unset: unsetData,
        },
      )
      .catch(error => console.error(error));
  }

  public async create8760CSVData(systemDesignId: ObjectId | string) {
    const systemDesign = await this.systemDesignModel.findById(systemDesignId).lean();

    if (!systemDesign) {
      throw new NotFoundException(`No system design found with id ${systemDesignId}`);
    }

    const utility = await this.utilityService.getUtilityByOpportunityId(systemDesign.opportunityId);

    if (!utility) {
      throw ApplicationException.EntityNotFound(systemDesign.opportunityId);
    }

    const systemActualProduction8760 = await this.getSystemActualProduction(systemDesignId);

    // existingPV
    const existingSystemProduction = await this.utilityService.getExistingSystemProductionByOpportunityId(
      systemDesign.opportunityId,
      true,
    );

    const hourlyExistingPVInKWh = existingSystemProduction.hourlyProduction.map(v => v / 1000);

    const utilityUsageProfileData: { [key: string]: number[] } = {};

    if (utility.utilityData.plannedProfile) {
      const utilityUsageProfileKeys = [
        HOURLY_USAGE_PROFILE.COMPUTED_ADDITIONS,
        HOURLY_USAGE_PROFILE.HOME_USAGE_PROFILE,
        HOURLY_USAGE_PROFILE.ADJUSTED_USAGE_PROFILE,
        HOURLY_USAGE_PROFILE.CURRENT_USAGE_PROFILE,
        HOURLY_USAGE_PROFILE.PLANNED_PROFILE,
      ];

      const cachedUtilityUsageProfileData = await this.utilityService.getHourlyDataByOpportunityId(
        systemDesign.opportunityId,
        utilityUsageProfileKeys,
      );

      cachedUtilityUsageProfileData.forEach((series, idx) => {
        utilityUsageProfileData[utilityUsageProfileKeys[idx]] = series;
      });
    }

    const hourlyTotalPV = systemActualProduction8760.map((v, i) => v + (hourlyExistingPVInKWh[i] || 0));

    const pinballDataSeriesKeys = [
      'postInstallSiteDemandSeries',
      'batteryStoredEnergySeries',
      'batteryChargingSeries',
      'batteryDischargingSeries',
      'rateAmountHourly',
    ];

    const filenames = pinballDataSeriesKeys.map(key => `${systemDesignId}/${key}`);

    const cachedPinballData: (string | undefined)[] = await this.s3Service.getObjects(
      this.PINBALL_SIMULATION_BUCKET,
      filenames,
    );

    const pinballData: any = {};

    cachedPinballData.forEach((series, idx) => {
      pinballData[pinballDataSeriesKeys[idx]] = series && JSON.parse(series);
    });

    // prepare header and data in the right order
    const csvFields = [
      'hour',
      'typicalHourlyUsage',
      'actualUsage',
      ...(utility.utilityData.plannedProfile ? [] : ['computedUsage']),
      'existingPV',
      'computedAdditions',
      'newPV',
      'totalPV',
      'homeUsageProfile',
      'adjustedUsageProfile',
      'currentUsageProfile',
      'plannedProfile',
      'batteryChargingSeries',
      'batteryDischargingSeries',
      'batteryStoredEnergySeries',
      'postInstallSiteDemandSeries',
      'rateAmountHourly',
      'shouldCharge',
      'shouldDischarge',
    ];

    const rateAmountHourly: number[] = [];
    const shouldCharge: boolean[] = [];
    const shouldDischarge: boolean[] = [];

    pinballData.rateAmountHourly?.forEach(hourly => {
      rateAmountHourly.push(hourly.rate);
      shouldCharge.push(hourly.shouldCharge ?? hourly.isCharge);
      shouldDischarge.push(hourly.shouldDischarge ?? !hourly.isCharge);
    });

    const [
      {
        typicalBaseline: { typicalHourlyUsage },
      },
      hourlyComputedUsage,
    ] = await Promise.all([
      this.utilityService.getTypicalBaselineData(utility.opportunityId),
      this.utilityService.getHourlyComputedUsageByOppotunityId(utility.opportunityId),
    ]);

    const csvData: any = {
      hour: Array.from({ length: 8760 }, (_, i) => i + 1),
      typicalHourlyUsage: typicalHourlyUsage?.map(hourly => hourly.v),
      actualUsage: utility.utilityData.actualUsage?.hourlyUsage?.map(hourly => hourly.v),
      ...(utility.utilityData.plannedProfile
        ? {}
        : {
            computedUsage: hourlyComputedUsage.map(hourly => hourly.v),
          }),
      existingPV: hourlyExistingPVInKWh,
      computedAdditions: utilityUsageProfileData.hourlyComputedAdditions,
      newPV: systemActualProduction8760,
      totalPV: hourlyTotalPV,
      homeUsageProfile: utilityUsageProfileData.hourlyHomeUsageProfile,
      adjustedUsageProfile: utilityUsageProfileData.hourlyAdjustedUsageProfile,
      currentUsageProfile: utilityUsageProfileData.hourlyCurrentUsageProfile,
      plannedProfile: utilityUsageProfileData.hourlyPlannedProfile,
      batteryChargingSeries: pinballData.batteryChargingSeries?.map(e => e / 1000), // convert to KWh
      batteryDischargingSeries: pinballData.batteryDischargingSeries?.map(e => e / 1000), // convert to KWh
      batteryStoredEnergySeries: pinballData.batteryStoredEnergySeries?.map(e => e / 1000), // convert to KWh
      postInstallSiteDemandSeries: pinballData.postInstallSiteDemandSeries?.map(e => e / 1000), // convert to KWh
      rateAmountHourly,
      shouldCharge,
      shouldDischarge,
    };

    return [csvFields, csvData];
  }

  public async generate8760DataSeriesCSV(systemDesignId: ObjectId | string) {
    const [csvFields, csvData] = await this.create8760CSVData(systemDesignId);

    const csv = transformDataToCSVFormat(csvFields, csvData);

    return OperationResult.ok(strictPlainToClass(CsvExportResDto, { csv }));
  }

  private applyDerate(data: number[], derateValue: number): number[] {
    if (derateValue === 1) return data;

    const result = data.map(v => new BigNumber(v).multipliedBy(derateValue).toNumber());
    return result;
  }

  private applyDerateByMonth(raw8760ProductionData: number[], monthlyDerate: number[]): number[] {
    const raw8760MonthlyHour = buildMonthlyHourFrom8760(raw8760ProductionData)
      .map((month, monthIndex) => {
        const derateValue = 1 - monthlyDerate[monthIndex] / 100;
        if (derateValue === 1) return month;

        return this.applyDerate(month, derateValue);
      })
      .flat();

    return raw8760MonthlyHour;
  }

  private applyInverterClipping(productionData8760: number[], systemDesign: LeanDocument<SystemDesign>): number[] {
    const maxInverterPower = this.sunroofHourlyProductionCalculation.calculateMaxInverterPower(systemDesign);

    if (maxInverterPower) {
      return this.sunroofHourlyProductionCalculation.clipArrayByInverterPower(productionData8760, maxInverterPower);
    }
    return productionData8760;
  }

  private applyInverterEfficiency(productionData8760: number[], systemDesign: LeanDocument<SystemDesign>): number[] {
    const {
      roofTopDesignData: { inverters },
    } = systemDesign;
    const [inverter] = inverters;

    if (inverter) {
      const inverterEfficiency = (inverter.inverterModelDataSnapshot.inverterEfficiency ?? 100) / 100;
      return this.applyDerate(productionData8760, inverterEfficiency);
    }
    return productionData8760;
  }

  private applyOtherLosses(productionData8760: number[], derateSnapshot: IDerateSnapshot): number[] {
    const { wiringLosses, connectionLosses, allOtherLosses } = derateSnapshot || {};

    let ratio = 1;

    const productionDerates = {
      wiringLosses,
      connectionLosses,
      allOtherLosses,
    };

    Object.values(productionDerates).forEach(item => {
      ratio *= 1 - (item || 0) / 100;
    });

    return this.applyDerate(productionData8760, ratio);
  }

  /**
   * Calculate System Production by array and apply:
   * 1 Scaled on Actual Monthly Usage,
   * 2 Mount Type Derate,
   * 3 First Year Degradation,
   * 4 Soiling Derate,
   * 5 Snow Derate,
   * 6 Inverter Clipping,
   * 7 Other Losses
   *
   * Then upload all of this to S3
   *
   * @param systemDesign
   * @returns Cumulative by hourly generation of all arrays - number[8760]
   */
  public async calculateSystemActualProduction(
    systemDesign: LeanDocument<SystemDesign>,
  ): Promise<CalculateSystemActualProductionResDto> {
    const handlers: Promise<unknown>[] = [
      this.systemProductService.calculateSystemProductionByHour(systemDesign),
      this.systemProductionService.findOne(systemDesign.systemProductionId),
      this.utilityService.getUtilityByOpportunityId(systemDesign.opportunityId),
    ];
    const isExistedGeotiff = await this.googleSunroofService.isExistedGeotiff(systemDesign);

    if (isExistedGeotiff) handlers.push(this.googleSunroofService.calculateProduction(systemDesign));

    const [systemPVWattProductionInWh, systemProductionInKwh, utilityAndUsage, sunroofProductionInKwh] = <
      [ISystemProduction, any, LeanDocument<UtilityUsageDetails> | null, SystemProduction]
    >await Promise.all(handlers);

    if (!utilityAndUsage) {
      throw ApplicationException.EntityNotFound(systemDesign.opportunityId);
    }

    if (!systemPVWattProductionInWh.arrayHourly) throw new NotFoundException(`Hourly production not found`);
    const systemPVWattProductionInKwh = systemPVWattProductionInWh.arrayHourly?.map(
      pvWattData => pvWattData.map(x => x / 1000), // convert PVWatt from Wh to kWh
    );

    if (!isExistedGeotiff) {
      const systemActualProduction8760 = range(8760).map(hourIdx =>
        sum(systemPVWattProductionInKwh.map(x => x[hourIdx])),
      );

      this.s3Service.putObject(
        this.GOOGLE_SUNROOF_BUCKET,
        `${
          systemDesign.opportunityId
        }/${systemDesign._id.toString()}/hourly-production/system-actual-production-8760.json`,
        JSON.stringify(systemActualProduction8760),
        'application/json',
      );

      return {
        systemActualProduction8760,
      };
    }

    // Some array use PVWatt data, some use Google Sunroof
    // Since PVWatt value already include degradation, so
    // only arrays that use Google Sunroof need to run through all of the scaling and degradation
    // keep PV Watt of panels that useSunroof is false
    const usePVWattArrayIndex: number[] = [];

    const {
      roofTopDesignData: { panelArray },
    } = systemDesign;

    // scale by sunroofProduction
    const scaled8760ProductionByArray = systemPVWattProductionInKwh.map((pvWattData, index) => {
      const { useSunroof } = panelArray[index];
      if (useSunroof)
        return this.utilityService.calculate8760OnActualMonthlyUsage(
          pvWattData,
          sunroofProductionInKwh.byArray[index].monthlyProduction,
        ) as number[];
      usePVWattArrayIndex.push(index);

      return pvWattData;
    });

    this.s3Service.putObject(
      this.GOOGLE_SUNROOF_BUCKET,
      `${
        systemDesign.opportunityId
      }/${systemDesign._id.toString()}/hourly-production/scaled-pvwatt-to-sunroof-production.json`,
      JSON.stringify(scaled8760ProductionByArray),
      'application/json',
    );

    // apply mount type derate
    const allMountTypes = await this.mountTypesService.findAllMountTypes();

    const appliedMountTypeDerate8760ProductionByArray = scaled8760ProductionByArray?.map((productionData, index) => {
      if (usePVWattArrayIndex.includes(index)) {
        return productionData;
      }

      let mountTypeDeratePercentage = 0;
      const { mountTypeId } = panelArray[index];
      if (mountTypeId) {
        const mountType = allMountTypes.find(mountType => mountType._id.toString() === mountTypeId);
        mountTypeDeratePercentage = (mountType?.deratePercentage || 0) / 100;
      }
      return this.applyDerate(productionData, 1 - mountTypeDeratePercentage);
    });

    this.s3Service.putObject(
      this.GOOGLE_SUNROOF_BUCKET,
      `${systemDesign.opportunityId}/${systemDesign._id.toString()}/hourly-production/applied-mount-type-derate.json`,
      JSON.stringify(appliedMountTypeDerate8760ProductionByArray),
      'application/json',
    );

    // apply First year Degradation
    const [firstPanelArray] = panelArray;
    const firstYearDegradation = (firstPanelArray?.panelModelDataSnapshot?.firstYearDegradation ?? 0) / 100;

    const appliedFirstYearDegradation8760ProductionByArray = appliedMountTypeDerate8760ProductionByArray?.map(
      (productionData, index) => {
        if (usePVWattArrayIndex.includes(index)) {
          return productionData;
        }

        return this.applyDerate(productionData, 1 - firstYearDegradation);
      },
    );

    this.s3Service.putObject(
      this.GOOGLE_SUNROOF_BUCKET,
      `${
        systemDesign.opportunityId
      }/${systemDesign._id.toString()}/hourly-production/applied-first-year-degradation.json`,
      JSON.stringify(appliedFirstYearDegradation8760ProductionByArray),
      'application/json',
    );

    // check derateSnapshot existed
    const derateSnapshot = systemProductionInKwh?.derateSnapshot
      ? systemProductionInKwh.derateSnapshot
      : await this.updateDerateSnapshot(systemDesign);
    const { soilingLosses, snowLosses } = derateSnapshot || {};

    // apply Soiling derate
    const soilingLossesAmounts = soilingLosses?.amounts || DEFAULT_ENVIRONMENTAL_LOSSES_DATA.amounts;

    const appliedSoilingDerate8760ProductionByArray = appliedFirstYearDegradation8760ProductionByArray?.map(
      (productionData, index) => {
        if (usePVWattArrayIndex.includes(index)) {
          return productionData;
        }

        return this.applyDerateByMonth(productionData, soilingLossesAmounts);
      },
    );

    this.s3Service.putObject(
      this.GOOGLE_SUNROOF_BUCKET,
      `${systemDesign.opportunityId}/${systemDesign._id.toString()}/hourly-production/applied-soiling-derate.json`,
      JSON.stringify(appliedSoilingDerate8760ProductionByArray),
      'application/json',
    );

    // apply Snow derate
    const snowLossesAmounts = snowLosses?.amounts || DEFAULT_ENVIRONMENTAL_LOSSES_DATA.amounts;
    const appliedSnowDerate8760ProductionByArray = appliedSoilingDerate8760ProductionByArray?.map(
      (productionData, index) => {
        if (usePVWattArrayIndex.includes(index)) {
          return productionData;
        }

        return this.applyDerateByMonth(productionData, snowLossesAmounts);
      },
    );

    this.s3Service.putObject(
      this.GOOGLE_SUNROOF_BUCKET,
      `${systemDesign.opportunityId}/${systemDesign._id.toString()}/hourly-production/applied-snow-derate.json`,
      JSON.stringify(appliedSnowDerate8760ProductionByArray),
      'application/json',
    );

    // apply Inverter Clipping
    const appliedInverterClipping8760ProductionByArray = appliedSnowDerate8760ProductionByArray.map(
      (productionData, index) => {
        if (usePVWattArrayIndex.includes(index)) {
          return productionData;
        }

        return this.applyInverterClipping(productionData, systemDesign);
      },
    );

    this.s3Service.putObject(
      this.GOOGLE_SUNROOF_BUCKET,
      `${systemDesign.opportunityId}/${systemDesign._id.toString()}/hourly-production/applied-inverter-clipping.json`,
      JSON.stringify(appliedInverterClipping8760ProductionByArray),
      'application/json',
    );

    // apply Inverter Efficiency
    const appliedInverterEfficiency8760ProductionByArray = appliedInverterClipping8760ProductionByArray.map(
      (productionData, index) => {
        if (usePVWattArrayIndex.includes(index)) {
          return productionData;
        }

        return this.applyInverterEfficiency(productionData, systemDesign);
      },
    );

    this.s3Service.putObject(
      this.GOOGLE_SUNROOF_BUCKET,
      `${systemDesign.opportunityId}/${systemDesign._id.toString()}/hourly-production/applied-inverter-efficiency.json`,
      JSON.stringify(appliedInverterEfficiency8760ProductionByArray),
      'application/json',
    );

    // apply OtherLosses
    const appliedOtherLosses8760ProductionByArray = appliedInverterEfficiency8760ProductionByArray.map(
      (productionData, index) => {
        if (usePVWattArrayIndex.includes(index)) {
          return productionData;
        }

        return this.applyOtherLosses(productionData, derateSnapshot);
      },
    );

    this.s3Service.putObject(
      this.GOOGLE_SUNROOF_BUCKET,
      `${
        systemDesign.opportunityId
      }/${systemDesign._id.toString()}/hourly-production/applied-wiring-connection-and-other-losses`,
      JSON.stringify(appliedOtherLosses8760ProductionByArray),
      'application/json',
    );

    // OUTPUT: array of array 12 number
    const monthlyProductionByArray = appliedOtherLosses8760ProductionByArray.map(productionData => {
      const monthly = buildMonthlyHourFrom8760(productionData);
      return monthly.map(x => sum(x));
    });

    const yearlyProductionByArray = monthlyProductionByArray.map(v => sum(v));

    const cumulativeGenerationKWh = sum(yearlyProductionByArray); // newPV

    const totalPlannedUsageIncreases = utilityAndUsage?.totalPlannedUsageIncreases || 0;

    if (systemProductionInKwh) {
      // existingPV
      const existingSystemProduction = await this.utilityService.getExistingSystemProductionByOpportunityId(
        systemDesign.opportunityId,
        true,
      );
      const annualExistingPVInKWh = existingSystemProduction.annualProduction;
      const monthlyExistingPVInKWh = existingSystemProduction.monthlyProduction.map(({ v }) => v);

      const annualTotalPV = cumulativeGenerationKWh + annualExistingPVInKWh; // newPV + existingPV
      const monthlyTotalPV = range(12).map(
        monthIndex => sum(monthlyProductionByArray.map(x => x[monthIndex])) + (monthlyExistingPVInKWh[monthIndex] || 0),
      ); // systemProductionArray (newPV) + existingPV

      const { adjustedUsageProfile } = utilityAndUsage.utilityData;

      const { capacityKW } = systemProductionInKwh;

      let offsetPercentage = totalPlannedUsageIncreases > 0 ? cumulativeGenerationKWh / totalPlannedUsageIncreases : 0;

      // handle backward compatibility
      if (adjustedUsageProfile) {
        const annualAdjustedUsageProfile = adjustedUsageProfile.annualUsage;
        offsetPercentage = annualTotalPV / annualAdjustedUsageProfile;
      }

      systemProductionInKwh.generationKWh = cumulativeGenerationKWh;
      systemProductionInKwh.productivity = capacityKW === 0 ? 0 : cumulativeGenerationKWh / capacityKW;
      systemProductionInKwh.offsetPercentage = offsetPercentage;

      // cumulative monthly generation of all arrays
      systemProductionInKwh.generationMonthlyKWh = monthlyTotalPV;
      // yearly generation for each array
      systemProductionInKwh.arrayGenerationKWh = yearlyProductionByArray;

      await systemProductionInKwh.save();
    }

    // TODO: handle leap year later
    const systemActualProduction8760 = range(8760).map(hourIdx =>
      sum(appliedOtherLosses8760ProductionByArray.map(x => x[hourIdx])),
    );

    this.s3Service.putObject(
      this.GOOGLE_SUNROOF_BUCKET,
      `${
        systemDesign.opportunityId
      }/${systemDesign._id.toString()}/hourly-production/system-actual-production-8760.json`,
      JSON.stringify(systemActualProduction8760),
      'application/json',
    );

    return {
      scaled8760ProductionByArray,
      appliedSoilingDerate8760ProductionByArray,
      appliedSnowDerate8760ProductionByArray,
      appliedInverterClipping8760ProductionByArray,
      appliedInverterEfficiency8760ProductionByArray,
      systemActualProduction8760,
    };
  }

  public async getSystemActualProduction(systemDesignId: ObjectId | string): Promise<number[]> {
    const foundSystemDesign = await this.getOneById(systemDesignId);

    if (!foundSystemDesign) {
      throw new NotFoundException(`System design with id ${systemDesignId} not found`);
    }

    const noneSolarProduction8760: number[] = new Array(8760).fill(0);

    // check if system design does not have panel array => no solar production
    if (!foundSystemDesign.roofTopDesignData?.panelArray.length) return noneSolarProduction8760;

    let cacheSystemActualProduction8760;

    try {
      cacheSystemActualProduction8760 = await this.s3Service.getObject(
        this.GOOGLE_SUNROOF_BUCKET,
        `${
          foundSystemDesign.opportunityId
        }/${systemDesignId.toString()}/hourly-production/system-actual-production-8760.json`,
      );
    } catch (_) {
      // Do not thing, any error, such as NoSuchKey (file not found)
    }

    if (cacheSystemActualProduction8760) return JSON.parse(cacheSystemActualProduction8760);

    const { systemActualProduction8760 } = await this.calculateSystemActualProduction(foundSystemDesign);

    return systemActualProduction8760;
  }

  public async buildPinballInputData(
    systemDesign: LeanDocument<SystemDesign>,
    systemActualProduction8760: number[],
    utility: LeanDocument<UtilityUsageDetails>,
  ): Promise<GetPinballSimulatorDto> {
    const existingSystemProduction = await this.utilityService.getExistingSystemProductionByOpportunityId(
      systemDesign.opportunityId,
      true,
    );

    const existingSystem = await this.existingSystem.getAll({ opportunityId: systemDesign.opportunityId });

    const hourlyPostInstallLoadInKWh = utility.utilityData.adjustedUsageProfile // handle backward compatibility
      ? (
          await this.utilityService.getHourlyDataByOpportunityId(systemDesign.opportunityId, [
            HOURLY_USAGE_PROFILE.ADJUSTED_USAGE_PROFILE,
          ])
        )[0]
      : (await this.utilityService.getHourlyEstimatedUsage(utility)).hourlyEstimatedUsage;

    const hourlySeriesForNewPVInWh: number[] = [];
    const hourlyPostInstallLoadInWh: number[] = [];
    const hourlySeriesForExistingPVInWh = existingSystemProduction.hourlyProduction;

    const maxLength = Math.max(
      systemActualProduction8760.length,
      hourlyPostInstallLoadInKWh.length,
      existingSystemProduction.hourlyProduction.length,
    );

    for (let i = 0; i < maxLength; i += 1) {
      if (systemActualProduction8760[i]) {
        hourlySeriesForNewPVInWh[i] = systemActualProduction8760[i] * 1000;
      }

      if (hourlyPostInstallLoadInKWh[i]) {
        hourlyPostInstallLoadInWh[i] = hourlyPostInstallLoadInKWh[i] * 1000;
      }
    }

    const hourlySeriesForTotalPVInWh: number[] = utility.utilityData.adjustedUsageProfile // adjustedUsageProfile ? newPV + existingPV : newPV
      ? hourlySeriesForNewPVInWh.map((v, i) => v + (hourlySeriesForExistingPVInWh[i] || 0))
      : hourlySeriesForNewPVInWh;

    const { storage } = systemDesign.roofTopDesignData;
    const existingSystemStorages: IExistingSystemStorage[] =
      utility.utilityData.adjustedUsageProfile && existingSystem.flatMap(item => item.storages);
    const pinballInputData = {
      hourlyPostInstallLoad: hourlyPostInstallLoadInWh,
      hourlySeriesForTotalPV: hourlySeriesForTotalPVInWh,
      postInstallMasterTariffId: utility.costData.postInstallMasterTariffId,
      zipCode: utility.utilityData.typicalBaselineUsage.zipCode,
      batterySystemSpecs: {
        totalRatingInKW:
          sumBy(storage, item => item.storageModelDataSnapshot.ratings.kilowatts || 0) +
          (existingSystemStorages ? sumBy(existingSystemStorages, item => item.ratings.kilowatts || 0) : 0),
        totalCapacityInKWh:
          sumBy(storage, item => item.storageModelDataSnapshot.ratings.kilowattHours || 0) +
          (existingSystemStorages ? sumBy(existingSystemStorages, item => item.ratings.kilowattHours || 0) : 0),
        roundTripEfficiency:
          storage[0]?.roundTripEfficiency || storage[0]?.storageModelDataSnapshot.roundTripEfficiency || 0,
        minimumReserve:
          storage[0]?.purpose === BATTERY_PURPOSE.BACKUP_POWER
            ? storage[0]?.reservePercentage
            : sumBy(storage, item => item.reservePercentage || 0) / storage.length || 0,
        operationMode: storage[0]?.purpose || BATTERY_PURPOSE.PV_SELF_CONSUMPTION,
      },
      medicalBaselineAmount: utility.medicalBaselineAmount,
      isLowIncomeOrDac: utility.isLowIncomeOrDac,
    };

    await this.s3Service.putObject(
      this.PINBALL_SIMULATION_BUCKET,
      `${systemDesign.id}/inputs`,
      JSON.stringify(pinballInputData),
      'application/json',
    );

    return pinballInputData;
  }

  async getPresignedPostURLUploadRooftopImage(fileType: string): Promise<OperationResult<GetPresignedPostUrlResDto>> {
    const fileExt = fileType.split('/')[1];
    const key = `${uuidv4()}.${fileExt}`;

    const Conditions = [
      ['content-length-range', PRESIGNED_POST_URL_MIN_SIZE, PRESIGNED_POST_URL_MAX_SIZE],
      ['eq', '$Content-Type', fileType],
    ];

    const options = {
      Conditions,
      Expires: PRESIGNED_POST_URL_EXPIRES,
    };

    const presignedPostData = await this.s3Service.getPresignedPostUrl(this.SYSTEM_DESIGN_S3_BUCKET, key, options);

    const result = {
      presignedPostData,
      key,
    };

    return OperationResult.ok(strictPlainToClass(GetPresignedPostUrlResDto, result));
  }

  async getPresignedGetURLOfRooftopImage(
    systemDesign: LeanDocument<SystemDesign> | Partial<SystemDesignModel>,
  ): Promise<string | undefined> {
    let presignedGetUrl;
    const { roofTopDesignData } = systemDesign;

    if (roofTopDesignData?.roofTopImage && roofTopDesignData?.roofTopImage.key) {
      presignedGetUrl = await this.s3Service.getPresignedGetUrl(
        this.SYSTEM_DESIGN_S3_BUCKET,
        roofTopDesignData.roofTopImage.key,
        PRESIGNED_GET_URL_EXPIRE_IN,
        true,
      );
    }

    return presignedGetUrl;
  }

  async updateRoofTopImage(
    id: ObjectId,
    rooftopImageDto: RoofTopImageReqDto,
  ): Promise<OperationResult<SystemDesignDto>> {
    const foundSystemDesign = await this.systemDesignModel.findById(id);

    if (!foundSystemDesign) {
      throw ApplicationException.EntityNotFound(id.toString());
    }

    const [systemProduction, isInUsed] = await Promise.all([
      this.systemProductionService.findById(foundSystemDesign.systemProductionId),
      this.checkInUsed(id.toString()),
    ]);

    if (!systemProduction.data) {
      throw ApplicationException.EntityNotFound(`with systemProduction ${foundSystemDesign.systemProductionId} `);
    }

    if (isInUsed) {
      throw new BadRequestException(isInUsed);
    }

    // update rooftop image data
    foundSystemDesign.roofTopDesignData.roofTopImage = rooftopImageDto;

    await foundSystemDesign.save();

    const systemDesignUpdated = foundSystemDesign.toJSON();

    // expose rooftop image URL
    const imageURL = await this.getPresignedGetURLOfRooftopImage(systemDesignUpdated);

    return OperationResult.ok(
      strictPlainToClass(SystemDesignDto, {
        ...systemDesignUpdated,
        systemProductionData: systemProduction.data,
        imageURL,
      }),
    );
  }

  async getProductionDeratesDesignSystemDetail(
    systemDesignId: string,
  ): Promise<OperationResult<ProductionDeratesDesignSystemDto>> {
    const systemDesign = await this.systemDesignModel.findById(systemDesignId).lean();

    if (!systemDesign) {
      throw ApplicationException.EntityNotFound(systemDesignId);
    }

    let cachedDataFromS3: any;

    try {
      cachedDataFromS3 = await Promise.all(
        [
          'scaled-pvwatt-to-sunroof-production.json',
          'applied-soiling-derate.json',
          'applied-snow-derate.json',
          'applied-inverter-clipping.json',
          'applied-inverter-efficiency.json',
        ].map(item =>
          this.s3Service.getObject(
            this.GOOGLE_SUNROOF_BUCKET,
            `${systemDesign.opportunityId}/${systemDesign._id.toString()}/hourly-production/${item}`,
          ),
        ),
      );
    } catch (error) {
      console.error(error);
    }

    let rawAnnualProductionArray: number[][];
    let soilingLossesArray: number[][];
    let snowLossesArray: number[][];
    let inverterRatingClippingArray: number[][];
    let dcAcConversionLossesArray: number[][];

    if (!cachedDataFromS3) {
      const actualProducion = await this.calculateSystemActualProduction(systemDesign);

      rawAnnualProductionArray = actualProducion.scaled8760ProductionByArray || [];
      soilingLossesArray = actualProducion.appliedSoilingDerate8760ProductionByArray || [];
      snowLossesArray = actualProducion.appliedSnowDerate8760ProductionByArray || [];
      inverterRatingClippingArray = actualProducion.appliedInverterClipping8760ProductionByArray || [];
      dcAcConversionLossesArray = actualProducion.appliedInverterEfficiency8760ProductionByArray || [];
    } else {
      const [
        rawAnnualProductionData,
        soilingLossesData,
        snowLossesData,
        inverterRatingClippingData,
        dcAcConversionLossesData,
      ] = cachedDataFromS3.map(item => JSON.parse(item));

      rawAnnualProductionArray = rawAnnualProductionData;
      soilingLossesArray = soilingLossesData;
      snowLossesArray = snowLossesData;
      inverterRatingClippingArray = inverterRatingClippingData;
      dcAcConversionLossesArray = dcAcConversionLossesData;
    }

    // Modules
    const modules = {
      value: systemDesign.roofTopDesignData?.panelArray[0]?.panelModelDataSnapshot?.name,
      array: systemDesign.roofTopDesignData?.panelArray.map(item => item.numberOfPanels),
      system: systemDesign.roofTopDesignData?.panelArray.reduce((sum, panel) => sum + panel?.numberOfPanels || 0, 0),
    };

    // STC Rating
    const arrayStcRating = systemDesign?.roofTopDesignData?.panelArray.map(
      item => (item.panelModelDataSnapshot.ratings.watts * item.numberOfPanels) / 1000,
    );
    const ratingWatts = systemDesign.roofTopDesignData?.panelArray[0]?.panelModelDataSnapshot?.ratings.watts;
    const stcRating = {
      value: ratingWatts,
      array: arrayStcRating,
      system: arrayStcRating?.reduce((total, currentValue) => total + currentValue, 0),
    };
    const arrayPtcRating = systemDesign.roofTopDesignData?.panelArray.map(item =>
      Math.round((item.panelModelDataSnapshot.ratings.wattsPtc * item.numberOfPanels) / 1000),
    );

    // PTC Rating
    const ratingWattsPtc = systemDesign.roofTopDesignData?.panelArray[0]?.panelModelDataSnapshot?.ratings.wattsPtc;
    const ptcRating = {
      value: ratingWattsPtc,
      subValue: Math.round(((ratingWattsPtc - ratingWatts) * 100) / ratingWatts),
      array: arrayPtcRating,
      system: arrayPtcRating?.reduce((total, currentValue) => total + currentValue, 0),
    };

    // Raw Annual Production
    const rawAnnualProductionSumArray = rawAnnualProductionArray?.map(item =>
      Math.round(item.reduce((acc, curr) => acc + curr, 0)),
    );
    const rawAnnualProductionSystem = rawAnnualProductionSumArray.reduce(
      (total, currentValue) => total + currentValue,
      0,
    );
    const rawAnnualProduction = {
      array: rawAnnualProductionSumArray,
      system: rawAnnualProductionSystem,
      netProduction: rawAnnualProductionSystem,
    };

    // Raw Annual Productivity
    const rawArrayAnnualProductivity = rawAnnualProductionSumArray.map((item, index) =>
      Math.round(item / arrayPtcRating[index]),
    );
    const rawAnnualProductivity = {
      array: rawArrayAnnualProductivity,
      system: Math.round(rawAnnualProduction.system / ptcRating.system),
    };

    // First Year Degradation
    const firstYearDegradationValue = roundNumber(
      systemDesign.roofTopDesignData?.panelArray[0].panelModelDataSnapshot.firstYearDegradation,
      2,
    );
    const firstYearDegradationArray = this.applyDerate(rawAnnualProductionSumArray, firstYearDegradationValue / 100);
    const firstYearDegradationSystem = Math.round((rawAnnualProduction.system * firstYearDegradationValue) / 100);
    const firstYearDegradation = {
      value: firstYearDegradationValue,
      array: firstYearDegradationArray,
      system: firstYearDegradationSystem,
      netProduction: rawAnnualProduction.system - firstYearDegradationSystem,
    };

    // Mount Type Derating
    const allMountTypes = await this.mountTypesService.findAllMountTypes();
    const {
      roofTopDesignData: { panelArray },
    } = systemDesign;

    let mountTypeDerating: IProductionDeratesData = {};
    const mountTypeDeratingArray = await Promise.all(
      panelArray.map(async (item, index) => {
        const mountTypesData = allMountTypes.find(mountType => mountType._id.toString() === item.mountTypeId);
        return {
          name: mountTypesData?.name || 'Unknown',
          derateNumber:
            Math.round(
              ((rawAnnualProductionSumArray[index] - firstYearDegradationArray[index]) *
                Number(mountTypesData?.deratePercentage)) /
                100,
            ) || 0,
          percent: mountTypesData?.deratePercentage || 0,
        };
      }),
    );

    const mountTypeDeratingSystem = mountTypeDeratingArray.reduce(
      (total, currentValue) => total + currentValue?.derateNumber,
      0,
    );
    mountTypeDerating = {
      array: mountTypeDeratingArray,
      system: mountTypeDeratingSystem,
      netProduction: firstYearDegradation.netProduction - mountTypeDeratingSystem,
    };

    // Soiling Losses
    const { data: systemProduction } = await this.systemProductionService.findById(systemDesign.systemProductionId);
    const derateSnapshot = systemProduction?.derateSnapshot;
    const soilingLossesNetProduction = Math.round(soilingLossesArray.flat().reduce((acc, curr) => acc + curr, 0));
    const soilingLosses = {
      value: derateSnapshot?.soilingLosses.regionDescription,
      subValue: derateSnapshot?.soilingLosses.amounts,
      system: mountTypeDerating.netProduction
        ? Math.abs(soilingLossesNetProduction - mountTypeDerating.netProduction ?? 0)
        : null,
      netProduction: soilingLossesNetProduction,
    };

    // Snow Losses
    const snowLossesNetProduction = Math.round(snowLossesArray.flat().reduce((acc, curr) => acc + curr, 0));
    const snowLosses = {
      value: derateSnapshot?.snowLosses.regionDescription || '',
      subValue: derateSnapshot?.snowLosses.amounts,
      system: Math.abs(snowLossesNetProduction - soilingLosses.netProduction),
      netProduction: snowLossesNetProduction,
    };

    // Inverter Rating Clipping
    const inverterRatingClippingNetProduction = Math.round(
      inverterRatingClippingArray?.flat().reduce((acc, curr) => acc + curr, 0),
    );
    const inverters = systemDesign.roofTopDesignData.inverters?.[0];
    const clippingSystemValue = Math.abs(inverterRatingClippingNetProduction - snowLossesNetProduction);
    const inverterRatingClipping = {
      value: inverters?.inverterModelDataSnapshot ? inverters?.inverterModelDataSnapshot.ratings.watts : '',
      system: {
        value: clippingSystemValue,
        percent: roundNumber((clippingSystemValue * 100) / snowLossesNetProduction),
      },
      netProduction: inverterRatingClippingNetProduction,
    };

    // DC/AC Conversion Losses
    const dcAcConversionLossesNetProduction = Math.round(
      dcAcConversionLossesArray?.flat().reduce((acc, curr) => acc + curr, 0),
    );
    const dcAcConversionLosses = {
      value: inverters?.inverterModelDataSnapshot?.inverterEfficiency
        ? roundNumber(100 - inverters?.inverterModelDataSnapshot?.inverterEfficiency)
        : 100,
      system: Math.abs(dcAcConversionLossesNetProduction - inverterRatingClippingNetProduction),
      netProduction: dcAcConversionLossesNetProduction,
    };

    // Wiring Losses | Connection Losses | All Other Losses | Annual Production
    let wiringLosses: IProductionDeratesData = {};
    let connectionLosses: IProductionDeratesData = {};
    let allOtherLosses: IProductionDeratesData = {};
    let annualProduction: IProductionDeratesData = {};
    if (derateSnapshot) {
      const wiringLossesNetProduction = Math.round(
        (1 - derateSnapshot.wiringLosses / 100) * dcAcConversionLosses.netProduction,
      );
      const connectionLossesNetProduction = Math.round(
        (1 - derateSnapshot.connectionLosses / 100) * wiringLossesNetProduction,
      );
      const allOtherLossesNetProduction = Math.round(
        (1 - derateSnapshot.allOtherLosses / 100) * connectionLossesNetProduction,
      );
      wiringLosses = {
        value: derateSnapshot.wiringLosses,
        system: Math.round((derateSnapshot.wiringLosses / 100) * dcAcConversionLossesNetProduction),
        netProduction: wiringLossesNetProduction,
      };
      connectionLosses = {
        value: derateSnapshot.connectionLosses,
        system: Math.round((derateSnapshot.connectionLosses / 100) * wiringLossesNetProduction),
        netProduction: connectionLossesNetProduction,
      };
      allOtherLosses = {
        value: derateSnapshot.allOtherLosses,
        system: Math.round((derateSnapshot.allOtherLosses / 100) * connectionLossesNetProduction),
        netProduction: allOtherLossesNetProduction,
      };
      annualProduction = {
        netProduction: allOtherLossesNetProduction,
      };
    }

    return OperationResult.ok(
      strictPlainToClass(ProductionDeratesDesignSystemDto, {
        modules,
        stcRating,
        ptcRating,
        rawAnnualProductivity,
        rawAnnualProduction,
        firstYearDegradation,
        mountTypeDerating,
        soilingLosses,
        snowLosses,
        inverterRatingClipping,
        dcAcConversionLosses,
        wiringLosses,
        allOtherLosses,
        connectionLosses,
        annualProduction,
      }),
    );
  }

  private async checkSentProposalOrGeneratedContract(
    systemDesign: SystemDesign,
  ): Promise<{ isSentProposalsExisted: boolean; isContractsExisted: boolean }> {
    const { _id: systemDesignId } = systemDesign;
    const [foundProposals, foundContracts] = await Promise.all([
      this.proposalService.getProposalsBySystemDesignId(systemDesignId.toString()),
      this.contractService.getNotVoidedContractsBySystemDesignId(systemDesignId.toString()),
    ]);

    const isContractsExisted = !!foundContracts.length;

    let isSentProposalsExisted = false;
    if (foundProposals.length) {
      isSentProposalsExisted = await (async () => {
        for (let index = 0; index < foundProposals.length; index++) {
          const proposal = foundProposals[index];
          // eslint-disable-next-line no-await-in-loop
          const isSent = await this.proposalService.checkIsSent(proposal);

          if (isSent) return true;
        }
        return false;
      })();
    }

    return {
      isSentProposalsExisted,
      isContractsExisted,
    };
  }
}
