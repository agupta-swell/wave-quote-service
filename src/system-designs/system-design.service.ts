/* eslint-disable no-plusplus */
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { isMongoId } from 'class-validator';
import { flatten, pickBy, sumBy, uniq } from 'lodash';
import { LeanDocument, Model, ObjectId, Types } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination } from 'src/app/common';
import { ContractService } from 'src/contracts/contract.service';
import { ECommerceService } from 'src/e-commerces/e-commerce.service';
import { ExistingSystemService } from 'src/existing-systems/existing-system.service';
import { ManufacturerService } from 'src/manufacturers/manufacturer.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { ProductionDeratesService } from 'src/production-derates-v2/production-derates-v2.service';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { IProductDocument, IUnknownProduct } from 'src/products-v2/interfaces';
import { ProductService } from 'src/products-v2/services';
import { ProposalService } from 'src/proposals/proposal.service';
import { QuotePartnerConfigService } from 'src/quote-partner-configs/quote-partner-config.service';
import { QuoteService } from 'src/quotes/quote.service';
import { AsyncContextProvider } from 'src/shared/async-context/providers/async-context.provider';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { GoogleSunroofService } from 'src/shared/google-sunroof/google-sunroof.service';
import { attachMeta } from 'src/shared/mongo';
import { assignToModel } from 'src/shared/transform/assignToModel';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { ISystemProduction as ISystemProduction_v2 } from 'src/system-productions/system-production.schema';
import { SystemProductionService } from 'src/system-productions/system-production.service';
import { IUtilityCostData } from 'src/utilities/utility.schema';
import { getCenterBound } from 'src/utils/calculate-coordinates';
import { calculateSystemDesignRadius } from 'src/utils/calculateSystemDesignRadius';
import { buildMonthlyAndAnnuallyDataFrom8760 } from 'src/utils/transformData';
import { transformDataToCSVFormat } from 'src/utils/transformDataToCSVFormat';
import { roundNumber } from 'src/utils/transformNumber';
import { CALCULATION_MODE } from '../utilities/constants';
import { UtilityService } from '../utilities/utility.service';
import { BATTERY_PURPOSE, DESIGN_MODE } from './constants';
import { SystemDesignHook } from './providers/system-design.hook';
import {
  CalculateSunroofOrientationDto,
  CreateSystemDesignDto,
  GetBoundingBoxesReqDto,
  UpdateAncillaryMasterDtoReq,
  UpdateSystemDesignDto,
} from './req';
import {
  CalculateSunroofOrientationResDto,
  CalculateSunroofProductionResDto,
  GetArrayOverlaySignedUrlResDto,
  GetBoundingBoxesResDto,
  GetHeatmapSignedUrlsResDto,
  SystemDesignAncillaryMasterDto,
  SystemDesignDto,
} from './res';
import { CsvExportResDto } from './res/sub-dto/csv-export-res.dto';
import { ISystemProduction, SunroofHourlyProductionCalculation, SystemProductService } from './sub-services';
import {
  IRoofTopSchema,
  SystemDesign,
  SystemDesignModel,
  SystemDesignWithManufacturerMeta,
  SYSTEM_DESIGN,
} from './system-design.schema';

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
    const totalPlannedUsageIncreases = utilityAndUsage?.totalPlannedUsageIncreases || 0;

    const arrayGenerationKWh: number[] = [];
    let cumulativeGenerationKWh = 0;
    let cumulativeCapacityKW = 0;

    if (systemDesign.designMode === DESIGN_MODE.ROOF_TOP) {
      const newPolygons = (systemDesign.roofTopDesignData?.panelArray?.map(p => p?.boundPolygon) ?? []).flat();
      const { lat, lng } = getCenterBound(newPolygons);
      const radiusMeters = calculateSystemDesignRadius({ lat, lng }, newPolygons);

      const handlers: Promise<unknown>[] = [this.googleSunroofService.isExistedGeotiff(lat, lng, radiusMeters)];
      // a system has only one module
      if (systemDesign.roofTopDesignData.panelArray.length) {
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
            item.arrayId = Types.ObjectId.isValid(item.arrayId) ? item.arrayId : Types.ObjectId();

            const {
              numberOfPanels,
              azimuth,
              pitch,
              overrideRooftopDetails,
              useSunroof,
              sunroofAzimuth,
              sunroofPitch,
              sunroofPrimaryOrientationSide,
            } = item;

            const capacity = (numberOfPanels * (panelModelData.ratings.watts ?? 0)) / 1000;
            // TODO: is this duplicated with systemProductionArray
            const acAnnual = await this.systemProductService.pvWatCalculation({
              lat: systemDesign.latitude,
              lon: systemDesign.longitude,
              azimuth: useSunroof && !overrideRooftopDetails && sunroofAzimuth !== undefined ? sunroofAzimuth : azimuth,
              systemCapacity: capacity,
              tilt: useSunroof && !overrideRooftopDetails && sunroofPitch !== undefined ? sunroofPitch : pitch,
              losses: item.losses,
            });

            arrayGenerationKWh[index] = acAnnual;
            cumulativeGenerationKWh += acAnnual;
            cumulativeCapacityKW += capacity;

            systemDesign.roofTopDesignData.panelArray[index].hasSunroofRooftop = [
              sunroofAzimuth,
              sunroofPitch,
              sunroofPrimaryOrientationSide,
            ].every(e => e !== undefined);

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

    // create systemProduction then save only systemProduction.id to current systemDesign
    const newSystemProduction = await this.systemProductionService.create({
      capacityKW: cumulativeCapacityKW,
      generationKWh: cumulativeGenerationKWh,
      productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
      annualUsageKWh,
      offsetPercentage: totalPlannedUsageIncreases > 0 ? cumulativeGenerationKWh / totalPlannedUsageIncreases : 0,
      generationMonthlyKWh: systemProductionArray.monthly,
      arrayGenerationKWh,
      pvWattProduction: buildMonthlyAndAnnuallyDataFrom8760(systemProductionArray.hourly), // calculate pv watt production typical
    });

    if (newSystemProduction.data) {
      systemDesign.systemProductionId = newSystemProduction.data.id;
    }

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

      const newPolygons = (systemDesign.roofTopDesignData?.panelArray?.map(p => p?.boundPolygon) ?? []).flat();
      const { lat, lng } = getCenterBound(newPolygons);
      const radiusMeters = calculateSystemDesignRadius({ lat, lng }, newPolygons);

      const _handlers: Promise<unknown>[] = [this.googleSunroofService.isExistedGeotiff(lat, lng, radiusMeters)];
      // a system has only one module
      if (systemDesign.roofTopDesignData.panelArray.length) {
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

          const {
            numberOfPanels,
            azimuth,
            pitch,
            overrideRooftopDetails,
            useSunroof,
            sunroofPitch,
            sunroofAzimuth,
            sunroofPrimaryOrientationSide,
          } = item;

          const capacity = (numberOfPanels * (panelModelData.ratings.watts ?? 0)) / 1000;

          const acAnnual = await this.systemProductService.pvWatCalculation({
            lat: systemDesign.latitude,
            lon: systemDesign.longitude,
            azimuth: useSunroof && !overrideRooftopDetails && sunroofAzimuth !== undefined ? sunroofAzimuth : azimuth,
            systemCapacity: capacity,
            tilt: useSunroof && !overrideRooftopDetails && sunroofPitch !== undefined ? sunroofPitch : pitch,
            losses: item.losses,
          });

          arrayGenerationKWh[index] = acAnnual;
          cumulativeGenerationKWh += acAnnual;
          cumulativeCapacityKW += capacity;

          systemDesign.roofTopDesignData.panelArray[index].hasSunroofRooftop = [
            sunroofAzimuth,
            sunroofPitch,
            sunroofPrimaryOrientationSide,
          ].every(e => e !== undefined);

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

      systemDesign.setSystemProductionData({
        capacityKW: cumulativeCapacityKW,
        generationKWh: cumulativeGenerationKWh,
        productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
        annualUsageKWh,
        offsetPercentage: totalPlannedUsageIncreases > 0 ? cumulativeGenerationKWh / totalPlannedUsageIncreases : 0,
        generationMonthlyKWh: systemProductionArray.monthly,
        arrayGenerationKWh,
        pvWattProduction: buildMonthlyAndAnnuallyDataFrom8760(systemProductionArray.hourly), // calculate pv watt typical production
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
        pvWattProduction: buildMonthlyAndAnnuallyDataFrom8760(systemProductionArray.hourly), // calculate pv watt typical production
      });

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

    await Promise.all(handlers);

    const useSunroof = (systemDesignDto.roofTopDesignData?.panelArray ?? []).some(p => p.useSunroof);

    if (useSunroof) {
      this.systemDesignHook.queueGenerateSunroofProduction(this.asyncContext.UNSAFE_getStore()!, foundSystemDesign);
    }

    const systemDesignUpdated = foundSystemDesign.toJSON();

    return OperationResult.ok(
      strictPlainToClass(SystemDesignDto, { ...systemDesignUpdated, systemProductionData: newSystemProduction }),
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
    if (!systemProduction.data) {
      throw ApplicationException.EntityNotFound(`with systemProduction ${foundSystemDesign.systemProductionId} `);
    }
    foundSystemDesign.systemProductionData = systemProduction.data;

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
    const [systemDesigns, utilityAndUsage] = await Promise.all([
      this.systemDesignModel.find({ opportunityId }),
      this.utilityService.getUtilityByOpportunityId(opportunityId),
    ]);

    const totalPlannedUsageIncreases = utilityAndUsage?.totalPlannedUsageIncreases || 0;

    try {
      await Promise.all(
        systemDesigns.map(async item => {
          const systemProduction = await this.systemProductionService.findById(item.systemProductionId);
          if (!systemProduction.data) {
            throw ApplicationException.EntityNotFound(`with systemProduction ${item.systemProductionId} `);
          }
          this.systemProductionService.update(item.systemProductionId, {
            annualUsageKWh,
            offsetPercentage:
              totalPlannedUsageIncreases > 0 ? systemProduction.data.generationKWh / totalPlannedUsageIncreases : 0,
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
          systemDesign.roofTopDesignData.panelArray.find(item => item.arrayId.toString() === arrayId);

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
    const URL_EXPIRE_IN = 3600;

    return Promise.all(
      pngs.map(e => this.s3Service.getSignedUrl(process.env.GOOGLE_SUNROOF_S3_BUCKET!, e, URL_EXPIRE_IN, true)),
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

    const URL_EXPIRE_IN = 3600;

    const signedUrl = await this.s3Service.getSignedUrl(
      process.env.GOOGLE_SUNROOF_S3_BUCKET!,
      key,
      URL_EXPIRE_IN,
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

  public async invokePINBALLSimulator(systemDesign: SystemDesign, systemProduction: ISystemProduction_v2) {
    const [utility, existingSystemProduction, systemProductionArray] = await Promise.all([
      this.utilityService.getUtilityByOpportunityId(systemDesign.opportunityId),
      this.utilityService.getExistingSystemProductionByOpportunityId(systemDesign.opportunityId, true),
      this.systemProductService.calculateSystemProductionByHour(systemDesign),
    ]);

    if (!utility) {
      throw ApplicationException.EntityNotFound(systemDesign.opportunityId);
    }

    const hourlyPostInstallLoadInKWh = this.utilityService.getHourlyEstimatedUsage(utility);

    const raw8760ProductionInKWh = this.utilityService.calculate8760OnActualMonthlyUsage(
      systemProductionArray.hourly,
      systemProduction.generationMonthlyKWh,
    ) as number[];

    const production8760AfterSoilingAndDegradationInKWh = await this.applyProductionSoilingAndDegradation(
      raw8760ProductionInKWh,
      systemDesign,
    );

    const production8760AfterClippedInKWh = this.applyInverterClipping(
      production8760AfterSoilingAndDegradationInKWh,
      systemDesign,
    );

    const production8760AfterAllOtherLossesInKWh = await this.applyOtherLosses(production8760AfterClippedInKWh);

    const hourlySeriesForNewPVInWh: number[] = [];
    const hourlyPostInstallLoadInWh: number[] = [];
    const hourlySeriesForExistingPVInWh = existingSystemProduction.hourlyProduction;

    const maxLength = Math.max(
      raw8760ProductionInKWh.length,
      hourlyPostInstallLoadInKWh.length,
      existingSystemProduction.hourlyProduction.length,
    );

    for (let i = 0; i < maxLength; i += 1) {
      if (production8760AfterAllOtherLossesInKWh[i]) {
        hourlySeriesForNewPVInWh[i] = production8760AfterAllOtherLossesInKWh[i] * 1000;
      }

      if (hourlyPostInstallLoadInKWh[i]) {
        hourlyPostInstallLoadInWh[i] = hourlyPostInstallLoadInKWh[i] * 1000;
      }
    }

    const { storage } = systemDesign.roofTopDesignData;
    const inputData = {
      hourlyPostInstallLoad: hourlyPostInstallLoadInWh,
      hourlySeriesForExistingPV: hourlySeriesForExistingPVInWh,
      hourlySeriesForNewPV: hourlySeriesForNewPVInWh,
      postInstallMasterTariffId: utility.costData.postInstallMasterTariffId,
      batterySystemSpecs: {
        totalRatingInKW: sumBy(storage, item => item.storageModelDataSnapshot.ratings.kilowatts || 0),
        totalCapacityInKWh: sumBy(storage, item => item.storageModelDataSnapshot.ratings.kilowattHours || 0),
        roundTripEfficiency: storage[0]?.roundTripEfficiency || 0,
        minimumReserve:
          storage[0]?.purpose === BATTERY_PURPOSE.BACKUP_POWER
            ? storage[0]?.reservePercentage
            : sumBy(storage, item => item.reservePercentage || 0) / storage.length || 0,
        operationMode: storage[0]?.purpose || BATTERY_PURPOSE.PV_SELF_CONSUMPTION,
      },
    };

    await this.s3Service.putObject(
      this.PINBALL_SIMULATION_BUCKET,
      `${systemDesign.id}/inputs`,
      JSON.stringify(inputData),
      'application/json; charset=utf-8',
    );

    const simulatePinballData = await this.utilityService.simulatePinball(inputData);

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

    const [monthlyCost] = await Promise.all([
      this.utilityService.calculateCost(
        simulatePinballData.postInstallSiteDemandSeries.map(i => i / 1000), // Wh -> KWh
        utility.costData.postInstallMasterTariffId,
        CALCULATION_MODE.ACTUAL,
      ),
      ...savePinballToS3Requests,
    ]);

    this.systemDesignModel
      .updateOne({ _id: systemDesign.id }, { costPostInstallation: monthlyCost as IUtilityCostData })
      .catch(error => console.error(error));
  }

  public async create8760CSVData(systemDesignId: ObjectId | string) {
    const systemDesign = await this.systemDesignModel.findById(systemDesignId).lean();

    if (!systemDesign) {
      throw new NotFoundException(`No system design found with id ${systemDesignId}`);
    }

    const [utility, systemProduction, systemProductionArray] = await Promise.all([
      this.utilityService.getUtilityByOpportunityId(systemDesign.opportunityId),
      this.systemProductionService.findOne(systemDesign.systemProductionId),
      this.systemProductService.calculateSystemProductionByHour(systemDesign),
    ]);

    if (!utility) {
      throw ApplicationException.EntityNotFound(systemDesign.opportunityId);
    }

    if (!systemProduction) {
      throw new NotFoundException(`System production with id ${systemDesign.systemProductionId} not found`);
    }

    const hourlySeriesForNewPVInKWh = this.utilityService.calculate8760OnActualMonthlyUsage(
      systemProductionArray.hourly,
      systemProduction.generationMonthlyKWh,
    ) as number[];

    const pinballDataSeriesKeys = [
      'postInstallSiteDemandSeries',
      'batteryStoredEnergySeries',
      'batteryChargingSeries',
      'batteryDischargingSeries',
      'rateAmountHourly',
    ];

    const getPinballData = pinballDataSeriesKeys.map(series =>
      this.s3Service.getObject(this.PINBALL_SIMULATION_BUCKET, `${systemDesignId}/${series}`),
    );

    const pinballData: any = {};

    try {
      const res = await Promise.all([...getPinballData]);

      for (let i = 0; i < res.length; i++) {
        const series = res[i];
        if (series) {
          pinballData[pinballDataSeriesKeys[i]] = JSON.parse(series);
        }
      }
    } catch (_) {
      // Do not thing, any error, such as NoSuchKey (file not found)
    }

    // prepare header and data in the right order
    const csvFields = [
      'Hour',
      'typical_hourly_usage',
      'actual_usage',
      'computed_usage',
      'new_pv', // TODO: update this field if more than one solar array
      'batteryChargingSeries',
      'batteryDischargingSeries',
      'batteryStoredEnergySeries',
      'postInstallSiteDemandSeries',
      'rateAmountHourly',
      'isCharging',
    ];

    const csvData: any = {
      Hour: Array.from({ length: 8760 }, (_, i) => i + 1),
      typical_hourly_usage: utility.utilityData.typicalBaselineUsage?.typicalHourlyUsage?.map(hourly => hourly.v),
      actual_usage: utility.utilityData.actualUsage?.hourlyUsage?.map(hourly => hourly.v),
      computed_usage: utility.utilityData.computedUsage?.hourlyUsage?.map(hourly => hourly.v),
      new_pv: hourlySeriesForNewPVInKWh, // TODO: update this field if more than one solar array
      batteryChargingSeries: pinballData.batteryChargingSeries?.map(e => e / 1000),
      batteryDischargingSeries: pinballData.batteryDischargingSeries?.map(e => e / 1000),
      batteryStoredEnergySeries: pinballData.batteryStoredEnergySeries?.map(e => e / 1000),
      postInstallSiteDemandSeries: pinballData.postInstallSiteDemandSeries?.map(e => e / 1000),
      rateAmountHourly: pinballData.rateAmountHourly?.map(hourly => hourly.rate),
      isCharging: pinballData.rateAmountHourly?.map(hourly => hourly.charge),
    };

    return [csvFields, csvData];
  }

  public async generate8760DataSeriesCSV(systemDesignId: ObjectId | string) {
    const [csvFields, csvData] = await this.create8760CSVData(systemDesignId);

    const csv = transformDataToCSVFormat(csvFields, csvData);

    return OperationResult.ok(strictPlainToClass(CsvExportResDto, { csv }));
  }

  private async applyProductionSoilingAndDegradation(
    raw8760ProductionData: number[],
    systemDesign: SystemDesign,
  ): Promise<number[]> {
    const {
      roofTopDesignData: { panelArray },
    } = systemDesign;

    const [firstPanelArray] = panelArray;

    const firstYearDegradation = (firstPanelArray?.panelModelDataSnapshot?.firstYearDegradation ?? 0) / 100;

    const soilingLosses = await this.eCommerceService.getSoilingLossesByOpportunityId(systemDesign.opportunityId);

    const multipliedByDegrade = v => roundNumber(v * (1 - firstYearDegradation) * (1 - soilingLosses / 100));

    return raw8760ProductionData.map(v => multipliedByDegrade(v));
  }

  private applyInverterClipping(productionData8760: number[], systemDesign: SystemDesign): number[] {
    const {
      roofTopDesignData: { inverters },
    } = systemDesign;

    const maxInverterPower = this.sunroofHourlyProductionCalculation.calculateMaxInverterPower(systemDesign);

    if (maxInverterPower) {
      const [inverter] = inverters;

      const inverterEfficiency = (inverter.inverterModelDataSnapshot.inverterEfficiency ?? 100) / 100;

      return this.sunroofHourlyProductionCalculation
        .clipArrayByInverterPower(productionData8760, maxInverterPower)
        .map(v => roundNumber(v * inverterEfficiency, 2));
    }
    return productionData8760;
  }

  private async applyOtherLosses(productionData8760: number[]) {
    const productionDerates = await this.productionDeratesService.getAllProductionDerates();

    let ratio = 1;

    productionDerates.data?.forEach(item => {
      ratio *= 1 - (item.amount || 0) / 100;
    });

    return productionData8760.map(v => roundNumber(v * ratio, 2));
  }
}
