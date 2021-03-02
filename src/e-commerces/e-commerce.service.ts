import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as dayjs from 'dayjs';
import { Model } from 'mongoose';
import { ExternalService } from 'src/external-services/external-service.service';
import { LeaseSolverConfigService } from 'src/lease-solver-configs/lease-solver-config.service';
import { SystemProductService } from 'src/system-designs/sub-services';
import { ISystemProductionSchema } from 'src/system-designs/system-design.schema';
import { CALCULATION_MODE } from 'src/utilities/constants';
import { CostDataDto, UtilityDataDto } from 'src/utilities/res';
import { ITypicalUsage } from 'src/utilities/utility.schema';
import { UtilityService } from 'src/utilities/utility.service';
import { toCamelCase } from 'src/utils/transformProperties';
import { OperationResult } from '../app/common';
import { ECOM_PRODUCT_TYPE } from './constants';
import { GetEcomSystemDesignAndQuoteReq } from './req/get-ecom-system-design-and-quote.dto';
import { GetEcomSystemDesignAndQuoteDto } from './res/get-ecom-system-design-and-quote.dto';
import {
  ECommerceConfig,
  ECommerceProduct,
  E_COMMERCE_CONFIG,
  E_COMMERCE_PRODUCT,
  REGION,
  Region,
  ZipCodeRegionMap,
  ZIP_CODE_REGION_MAP,
} from './schemas';

@Injectable()
export class ECommerceService {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly leaseSolverConfigService: LeaseSolverConfigService,
    private readonly systemProductService: SystemProductService,
    private readonly externalService: ExternalService,
    @InjectModel(E_COMMERCE_CONFIG) private readonly eCommerceConfigModel: Model<ECommerceConfig>,
    @InjectModel(REGION) private readonly regionModel: Model<Region>,
    @InjectModel(ZIP_CODE_REGION_MAP) private readonly zipCodeRegionMapModel: Model<ZipCodeRegionMap>,
    @InjectModel(E_COMMERCE_PRODUCT) private readonly eCommerceProductModel: Model<ECommerceProduct>,
  ) {}

  async getData(req: GetEcomSystemDesignAndQuoteReq): Promise<OperationResult<GetEcomSystemDesignAndQuoteDto>> {
    const {
      addressDataDetail: { lat, long, zip: zipCode },
      monthlyUtilityBill,
    } = req;

    const utilityDataInst = new UtilityDataDto({});
    const costDataInst = new CostDataDto({} as any);
    const loadServingEntityInst = await this.utilityService.getLoadServingEntity(zipCode);
    const utilityTariffDataInst = (await this.utilityService.getTariffs(zipCode, Number(loadServingEntityInst.lseId)))
      .data;
    const typicalBaselineInst = (await this.utilityService.getTypicalBaseline(zipCode, true)).data;

    utilityDataInst.loadServingEntityData = loadServingEntityInst;
    utilityDataInst.typicalBaselineUsage = typicalBaselineInst.typicalBaselineUsage;

    const utilityTypicalCostDataInst = await this.utilityService.calculateCost(
      typicalBaselineInst.typicalBaselineUsage.typicalHourlyUsage.map(i => i.v),
      utilityTariffDataInst.tariffDetails[0].masterTariffId,
      CALCULATION_MODE.TYPICAL,
      new Date().getFullYear(),
      zipCode,
    );

    costDataInst.masterTariffId = utilityTariffDataInst.tariffDetails[0].masterTariffId;
    costDataInst.typicalUsageCost = toCamelCase(utilityTypicalCostDataInst);

    // TODO: January as 0, December as 11
    // in lucidchart, we substract 2 but this dayjs count January equal 0 hence we just write 1 in subtract function of dayjs
    const monthToAdjust = dayjs().subtract(1, 'month').get('month'); // ASSUME THE AMOUNT ENTERED BY THE USER IS TWO MONTH OLDER
    const deltaValueRatio =
      (monthlyUtilityBill - utilityTypicalCostDataInst.cost?.find(item => item.i === monthToAdjust)?.v) /
      monthlyUtilityBill;

    const actualMonthlyUsage: ITypicalUsage[] = [];
    let annualUsage = 0;

    typicalBaselineInst.typicalBaselineUsage.typicalMonthlyUsage.forEach(item => {
      actualMonthlyUsage.push({ i: item.i, v: item.v * (1 + deltaValueRatio) });
      annualUsage += item.v * deltaValueRatio;
    });

    utilityDataInst.actualUsage.monthlyUsage = actualMonthlyUsage;

    const actualCostDataInst = (
      await this.utilityService.calculateActualUsageCost({
        masterTariffId: utilityTariffDataInst.tariffDetails[0].masterTariffId,
        zipCode,
        utilityData: utilityDataInst,
      })
    ).data?.actualUsageCost;
    costDataInst.actualUsageCost = actualCostDataInst;

    // FIXME: not yet testing

    // MODULE DESIGN SECTION
    // TODO: need to consider this logic when haing data ----- zipCode is an unique value.
    const foundZipCode = await this.zipCodeRegionMapModel.findOne({ zip_codes: [zipCode] });
    const foundRegion = await this.regionModel.findById(foundZipCode.region_id);
    const foundECommerceConfig = await this.eCommerceConfigModel.findOne({ region_id: foundRegion._id });
    const { design_factor, loan_terms_in_months, loan_interest_rate } = foundECommerceConfig;
    const requiredpVGeneration = annualUsage / design_factor;
    const panelSTCRating = (await this.eCommerceProductModel.findOne({ type: ECOM_PRODUCT_TYPE.PANEL })).sizeW;
    const numberOfPanels = (requiredpVGeneration * 1000) / panelSTCRating;

    //CALCULATE PROJECT PARAMETERS (TYPICALLY USED FOR LEASE QUOTE)

    const azimuth = 180; // "Assuming a perfect 180 degrees for module placement"
    const tilt = 23; // "Assuming a perfect 23 degrees for pitch"
    const losses = 5.5; // "Assuming a loss factor of 5.5"
    const systemCapacity: number = numberOfPanels * panelSTCRating;
    const netGenerationKWh = await this.systemProductService.pvWatCalculation({
      lat,
      lon: long,
      systemCapacity,
      azimuth,
      tilt,
      losses,
    });

    const systemProduction: ISystemProductionSchema = {
      capacityKW: systemCapacity,
      generationKWh: netGenerationKWh,
      productivity: netGenerationKWh / systemCapacity,
      annual_usageKWh: annualUsage,
      offset_percentage: netGenerationKWh / annualUsage,
      generationMonthlyKWh: [],
    };

    //STORAGE DESIGN SECTION
    const numberOfBatteries = 1; //CURRENTLY ASSUMED TO BE 1.
    const storagePerBatteryInkWh = (await this.eCommerceProductModel.findOne({ type: ECOM_PRODUCT_TYPE.PANEL })).sizeW;

    return OperationResult.ok(true as any);
  }

  // ===================== INTERNAL =====================

  // async calculateLeaseQuoteForECom(
  //   isSolar: boolean,
  //   isRetrofit: boolean,
  //   leaseAmount: number,
  //   contractTerm: number,
  //   storageSize: number,
  //   capacitykW: number,
  //   rateEscalator: number,
  //   productivity: number,
  //   addGridServiceDiscount: boolean,
  // ): Promise<number> {
  //   const foundLeaseSolverConfig = await this.leaseSolverConfigService.getDetailByConditions({
  //     isSolar,
  //     isRetrofit,
  //     utilityProgramName: 'none',
  //     contractTerm,
  //     storageSize,
  //     capacityKW,
  //     rateEscalator,
  //     productivity,
  //   });
  //   return 0;
  // }
}
