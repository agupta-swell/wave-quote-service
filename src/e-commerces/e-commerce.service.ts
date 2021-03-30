import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as dayjs from 'dayjs';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { EmailService } from 'src/emails/email.service';
import { FINANCE_PRODUCT_TYPE } from 'src/quotes/constants';
import { CalculateQuoteDetailDto } from 'src/quotes/req/calculate-quote-detail.dto';
import { LoanProductAttributesDto } from 'src/quotes/req/sub-dto/loan-product-attributes.dto';
import { CalculationService } from 'src/quotes/sub-services/calculation.service';
import { SystemProductService } from 'src/system-designs/sub-services';
import { ISystemProductionSchema } from 'src/system-designs/system-design.schema';
import { CALCULATION_MODE } from 'src/utilities/constants';
import { CostDataDto, UtilityDataDto } from 'src/utilities/res';
import { ITypicalUsage } from 'src/utilities/utility.schema';
import { UtilityService } from 'src/utilities/utility.service';
import { toCamelCase } from 'src/utils/transformProperties';
import { OperationResult } from '../app/common';
import { ECOM_PRODUCT_TYPE, ENERGY_SERVICE_TYPE, PAYMENT_TYPE } from './constants';
import { GetEcomSystemDesignAndQuoteReq } from './req/get-ecom-system-design-and-quote.dto';
import { GetEcomSystemDesignAndQuoteDto } from './res/get-ecom-system-design-and-quote.dto';
import { CostDetailDataDto, PaymentOptionDataDto } from './res/sub-dto';
import {
  ECommerceConfig,
  ECommerceProduct,
  ECommerceSystemDesign,
  E_COMMERCE_CONFIG,
  E_COMMERCE_PRODUCT,
  E_COMMERCE_SYSTEM_DESIGN,
  REGION,
  Region,
  ZipCodeRegionMap,
  ZIP_CODE_REGION_MAP,
} from './schemas';

@Injectable()
export class ECommerceService {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly systemProductService: SystemProductService,
    private readonly calculationService: CalculationService,
    private readonly emailService: EmailService,
    @InjectModel(E_COMMERCE_CONFIG) private readonly eCommerceConfigModel: Model<ECommerceConfig>,
    @InjectModel(REGION) private readonly regionModel: Model<Region>,
    @InjectModel(ZIP_CODE_REGION_MAP) private readonly zipCodeRegionMapModel: Model<ZipCodeRegionMap>,
    @InjectModel(E_COMMERCE_PRODUCT) private readonly eCommerceProductModel: Model<ECommerceProduct>,
    @InjectModel(E_COMMERCE_SYSTEM_DESIGN) private readonly eCommerceSystemDesignModel: Model<ECommerceSystemDesign>,
  ) {}

  async getEcomSystemDesignAndQuote(
    req: GetEcomSystemDesignAndQuoteReq,
  ): Promise<OperationResult<GetEcomSystemDesignAndQuoteDto>> {
    const {
      addressDataDetail: { lat, long, zip: zipCode },
      monthlyUtilityBill,
      ecomVisitId,
      depositAmount,
    } = req;

    const utilityDataInst = new UtilityDataDto({});
    const costDataInst = new CostDataDto({} as any);

    const loadServingEntityInst = (await this.utilityService.getLoadServingEntities(zipCode)).data;

    const utilityTariffDataInst = (
      await this.utilityService.getTariffs(zipCode, Number(loadServingEntityInst?.[0]?.lseId))
    ).data;
    const typicalBaselineInst = (await this.utilityService.getTypicalBaseline(zipCode, true)).data;

    utilityDataInst.loadServingEntityData = loadServingEntityInst as any;
    utilityDataInst.typicalBaselineUsage = typicalBaselineInst?.typicalBaselineUsage || ({} as any);

    const utilityTypicalCostDataInst = await this.utilityService.calculateCost(
      (typicalBaselineInst?.typicalBaselineUsage?.typicalHourlyUsage || []).map(i => i.v),
      utilityTariffDataInst?.tariffDetails[0].masterTariffId || '',
      CALCULATION_MODE.TYPICAL,
      new Date().getFullYear(),
      zipCode,
    );

    costDataInst.masterTariffId = utilityTariffDataInst?.tariffDetails[0].masterTariffId || '';
    costDataInst.typicalUsageCost = toCamelCase(utilityTypicalCostDataInst);

    // TODO: January as 0, December as 11
    // in lucidchart, we substract 2 but this dayjs count January equal 0 hence we just write 1 in subtract function of dayjs
    const monthToAdjust = dayjs().subtract(1, 'month').get('month'); // ASSUME THE AMOUNT ENTERED BY THE USER IS TWO MONTH OLDER
    const deltaValueRatio =
      (monthlyUtilityBill - (utilityTypicalCostDataInst.cost?.find(item => item.i === monthToAdjust)?.v || 0)) /
      monthlyUtilityBill;

    const actualMonthlyUsage: ITypicalUsage[] = [];
    let annualUsage = 0;

    typicalBaselineInst?.typicalBaselineUsage.typicalMonthlyUsage.forEach(item => {
      actualMonthlyUsage.push({ i: item.i, v: item.v * (1 + deltaValueRatio) });
      annualUsage += item.v * deltaValueRatio;
    });

    utilityDataInst.actualUsage.monthlyUsage = actualMonthlyUsage;

    const actualCostDataInst = (
      await this.utilityService.calculateActualUsageCost({
        masterTariffId: utilityTariffDataInst?.tariffDetails[0].masterTariffId || '',
        zipCode,
        utilityData: utilityDataInst,
      })
    ).data?.actualUsageCost;
    costDataInst.actualUsageCost = actualCostDataInst || undefined;

    // MODULE DESIGN SECTION
    const foundZipCode = await this.zipCodeRegionMapModel.findOne({ zip_codes: zipCode });
    if (!foundZipCode) {
      const subject = `Undefined Zipcode Mapping ${zipCode}`;
      const body = `eCommerce system request for zip code ${zipCode} could not be fulfilled as the ZIP code could not be mapped to a region.`;
      await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);
      return OperationResult.ok('No detail available for zip code' as any);
    }

    const foundRegion = await this.regionModel.findById(foundZipCode.region_id);
    if (!foundRegion) {
      const subject = `Undefined region Mapping ${foundZipCode.region_id}`;
      const body = `eCommerce system request for zip code ${zipCode} could not be fulfilled as the REGION code could not be mapped to a region.`;
      await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);
      return OperationResult.ok('No detail available for zip code' as any);
    }

    const foundECommerceConfig = await this.eCommerceConfigModel.findOne({ region_id: foundRegion._id });
    if (!foundECommerceConfig) {
      const subject = `E Commerce Config does not find with region ${foundRegion._id}`;
      const body = `E Commerce Config does not find with region ${foundRegion._id}`;
      await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);
      throw ApplicationException.EntityNotFound('E Commerce Config');
    }

    const {
      design_factor,
      loan_terms_in_months,
      loan_interest_rate,
      module_price_per_watt,
      storage_price,
      labor_cost_perWatt,
    } = foundECommerceConfig;
    const requiredpVGeneration = annualUsage / design_factor;
    const foundEComProduct = await this.eCommerceProductModel.findOne({ type: ECOM_PRODUCT_TYPE.PANEL }).lean();
    if (!foundEComProduct) {
      const subject = `E Commerce Product does not find with panel type `;
      const body = `E Commerce Product does not find with panel type `;
      await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);
      throw ApplicationException.EntityNotFound('E Commerce Product');
    }

    const panelSTCRating = foundEComProduct?.sizeW || 1;
    const numberOfPanels = Math.ceil((requiredpVGeneration * 1000) / panelSTCRating);

    // CALCULATE PROJECT PARAMETERS (TYPICALLY USED FOR LEASE QUOTE)
    const azimuth = 180; // "Assuming a perfect 180 degrees for module placement"
    const tilt = 23; // "Assuming a perfect 23 degrees for pitch"
    const losses = 5.5; // "Assuming a loss factor of 5.5"
    const systemCapacity = (numberOfPanels * panelSTCRating) / 1000; //  system capacity is using KW as a unit so we need divide by 1000
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

    // STORAGE DESIGN SECTION
    const foundEComBatteryProduct = await this.eCommerceProductModel
      .findOne({ type: ECOM_PRODUCT_TYPE.BATTERY })
      .lean();
    if (!foundEComBatteryProduct) {
      const subject = `E Commerce Product does not find with battery type `;
      const body = `E Commerce Product does not find with battery type `;
      await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);
      throw ApplicationException.EntityNotFound('E Commerce Product');
    }

    const storagePerBatteryInkWh = (foundEComBatteryProduct?.sizeW ?? 0) / 1000;

    // QUOTE CALCULATION SECTION

    // TODO: THIS LOGIC NEEDS TO BE VALIDATED WITH BUSINESS, ESPECIALLY THE  STORAGE COST CALCULATIONS AND THE LABOR COST CALCULATIONS.
    const solarCost = requiredpVGeneration * module_price_per_watt * 1000;
    const storageCost = storage_price;
    const laborCost = requiredpVGeneration * labor_cost_perWatt;
    const overAllCost = solarCost + storageCost + laborCost;

    // BUILD ECOM SYSTEM DESIGN OBJECT
    const ecomSystemDesign = {
      e_com_visit_id: ecomVisitId,
      system_design_product: {
        number_of_modules: numberOfPanels,
        number_of_batteries: 1,
        total_labor_cost: laborCost,
        total_cost: overAllCost,
        ecom_config_snapshot: foundECommerceConfig,
        ecom_config_snapshot_date: new Date(),
        ecom_products_snapshot: [foundEComProduct, foundEComBatteryProduct],
        ecom_products_snapshot_date: new Date(),
      },
    };

    await this.eCommerceSystemDesignModel.create(ecomSystemDesign);

    // CALCULATE LOAN AMOUNT USING WAVE 2.0

    const calculateQuoteDetailDto: CalculateQuoteDetailDto = {
      quoteId: '',
      systemProduction: {} as any,
      utilityProgram: {} as any,
      quoteFinanceProduct: {
        financeProduct: {} as any,
      },
    } as any;
    calculateQuoteDetailDto.systemProduction.capacityKW = numberOfPanels * panelSTCRating;
    // calculateQuoteDetailDto.quotepricePerKwh = module_price_per_watt;
    calculateQuoteDetailDto.quoteFinanceProduct.financeProduct.productType = FINANCE_PRODUCT_TYPE.LOAN;
    const loanProductAttributesDto: LoanProductAttributesDto = {} as any;
    loanProductAttributesDto.upfrontPayment = depositAmount;
    loanProductAttributesDto.loanAmount = overAllCost - depositAmount;
    loanProductAttributesDto.interestRate = loan_interest_rate;
    loanProductAttributesDto.loanTerm = loan_terms_in_months;
    loanProductAttributesDto.reinvestment = null as any;
    calculateQuoteDetailDto.quoteFinanceProduct.financeProduct.productAttribute = loanProductAttributesDto;
    const calculateQuoteDetailDtoResponse = await this.calculationService.calculateLoanSolver(
      calculateQuoteDetailDto,
      0,
    );

    const getEcomSystemDesignAndQuoteResponse = new GetEcomSystemDesignAndQuoteDto();

    const loanPaymentOptionDataDto: PaymentOptionDataDto = {
      paymentType: PAYMENT_TYPE.LOAN,
      paymentDetail: {
        monthlyPaymentAmount:
          (calculateQuoteDetailDtoResponse.quoteFinanceProduct.financeProduct.productAttribute as any)
            .yearlyLoanPaymentDetails[0].monthlyPaymentDetails[2].monthlyPayment || 0,
        savingsFiveYear: -1, // NOTE: TODO - PENDING JON'S SAVING DATA
        savingTwentyFiveYear: -1, // NOTE: TODO - PENDING JON'S SAVING DATA
        deposit: depositAmount,
      },
    };

    getEcomSystemDesignAndQuoteResponse.paymentOptionData.push(loanPaymentOptionDataDto);

    // SET THE CASH QUOTE DETAILS
    const cashPaymentOptionDataDtoInst: PaymentOptionDataDto = {
      paymentType: PAYMENT_TYPE.CASH,
      paymentDetail: {
        monthlyPaymentAmount: overAllCost - depositAmount,
        savingsFiveYear: -1, // NOTE: TODO - PENDING JON'S SAVING DATA
        savingTwentyFiveYear: -1, // NOTE: TODO - PENDING JON'S SAVING DATA
        deposit: depositAmount,
      },
    };

    getEcomSystemDesignAndQuoteResponse.paymentOptionData.push(cashPaymentOptionDataDtoInst);

    // CALCULATE THE LEASE AMOUNT USING WAVE 2.0 QUOTE
    const rateEscalator = 2.9; // "Rate escalator is currently assumed to be 2.9"
    const contractTerm = 25; // "Contract term is currently assumed to be 25"
    const utilityProgramName = 'none';

    // LEASE FOR ESSENTIAL BACKUP
    // const pricePerKwhForEssentialBackup = overAllCost / systemProduction.capacityKW / 1000;
    const {
      monthlyLeasePayment: monthlyEsaAmountForEssentialBackup,
      rate_per_kWh: pricePerKwhForEssentialBackup,
    } = await this.calculationService.calculateLeaseQuoteForECom(
      true,
      false,
      overAllCost,
      contractTerm,
      storagePerBatteryInkWh,
      systemCapacity,
      rateEscalator,
      systemProduction.productivity,
      false,
      utilityProgramName,
    );

    if (monthlyEsaAmountForEssentialBackup === -1) {
      const subject = `Lease Solver Config Not Found in E Commerce`;
      const body = `Lease Solver Config Not Found in E Commerce with these conditions:
        isSolar:${true},
        isRetrofit:${false},
        utilityProgramName: ${utilityProgramName},
        contractTerm:${contractTerm},
        storageSize:${storagePerBatteryInkWh},
        rateEscalator:${rateEscalator},
        capacityKW:${systemCapacity},
        productivity:${systemProduction.productivity},
      `;

      await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);
    }

    // LEASE FOR WHOLE HOME BACKUP
    const overallCostForWholeHomeBackup = overAllCost + storageCost; // Add 1 battery additional on top of essential backup
    // const pricePerKwhForWholeHomeBackup = overallCostForWholeHomeBackup / systemProduction.capacityKW / 1000;
    const {
      monthlyLeasePayment: monthlyEsaAmountForWholeHomeBackup,
      rate_per_kWh: pricePerKwhForWholeHomeBackup,
    } = await this.calculationService.calculateLeaseQuoteForECom(
      true,
      false,
      overallCostForWholeHomeBackup,
      contractTerm,
      2 * storagePerBatteryInkWh,
      systemCapacity,
      rateEscalator,
      systemProduction.productivity,
      false,
      utilityProgramName,
    );

    if (monthlyEsaAmountForWholeHomeBackup === -1) {
      const subject = `Lease Solver Config Not Found in E Commerce`;
      const body = `Lease Solver Config Not Found in E Commerce with these conditions:
        isSolar:${true},
        isRetrofit:${false},
        utilityProgramName: ${utilityProgramName},
        contractTerm:${contractTerm},
        storageSize:${2 * storagePerBatteryInkWh},
        rateEscalator:${rateEscalator},
        capacityKW:${systemCapacity},
        productivity:${systemProduction.productivity},
      `;

      await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);
    }

    // BUILD getEcomSystemDesignAndQuote RESPONSE FOR QUOTE OPTIONS

    getEcomSystemDesignAndQuoteResponse.pvModuleDetailData.systemKW = systemCapacity;
    getEcomSystemDesignAndQuoteResponse.pvModuleDetailData.percentageOfSelfPower = 0; // TO DO: CALCULATION TBD
    getEcomSystemDesignAndQuoteResponse.pvModuleDetailData.percentageOfSelfPower = 0; // TO DO: CALCULATION TBD
    getEcomSystemDesignAndQuoteResponse.pvModuleDetailData.estimatedTwentyFiveYearsSavings = 0; // TO DO:  CALCULATION TBD - PENDING JON'S SAVING DATA
    getEcomSystemDesignAndQuoteResponse.storageSystemDetailData.storageSystemCount = 1;
    getEcomSystemDesignAndQuoteResponse.storageSystemDetailData.storageSystemKWh = storagePerBatteryInkWh;
    getEcomSystemDesignAndQuoteResponse.storageSystemDetailData.numberOfDaysBackup = 0; // TO DO: CALCULATION TBD

    const essentialBackupCostDetailDataDtoInst: CostDetailDataDto = {
      energyServiceType: ENERGY_SERVICE_TYPE.SWELL_ESA_ESSENTIAL_BACKUP,
      quoteDetail: {
        monthlyCost: monthlyEsaAmountForEssentialBackup,
        pricePerKwh: pricePerKwhForEssentialBackup,
        estimatedIncrease: rateEscalator,
        estimatedBillInTenYears: monthlyEsaAmountForEssentialBackup * Math.pow(1 + rateEscalator / 100, 10),
        cumulativeSavingsOverTwentyFiveYears: -1, // TO DO:  CALCULATION TBD - PENDING JON'S SAVING DATA
      },
    };
    getEcomSystemDesignAndQuoteResponse.costDetailsData.push(essentialBackupCostDetailDataDtoInst);

    const whBackupCostDetailDataDtoInst: CostDetailDataDto = {
      energyServiceType: ENERGY_SERVICE_TYPE.SWELL_ESA_WHOLE_HOME,
      quoteDetail: {
        monthlyCost: monthlyEsaAmountForWholeHomeBackup,
        pricePerKwh: pricePerKwhForWholeHomeBackup,
        estimatedIncrease: rateEscalator,
        estimatedBillInTenYears: monthlyEsaAmountForWholeHomeBackup * Math.pow(1 + rateEscalator / 100, 10),
        cumulativeSavingsOverTwentyFiveYears: -1, // TO DO:  CALCULATION TBD - PENDING JON'S SAVING DATA
      },
    };
    getEcomSystemDesignAndQuoteResponse.costDetailsData.push(whBackupCostDetailDataDtoInst);

    // SET THE QUOTE FOR ESSENTIAL BACKUP AND WHOLE HOME PACKUP
    const essentialBackupPaymentOptionDataDtoInst: PaymentOptionDataDto = {
      paymentType: PAYMENT_TYPE.LEASE_ESSENTIAL_BACKUP,
      paymentDetail: {
        monthlyPaymentAmount: monthlyEsaAmountForEssentialBackup,
        savingsFiveYear: -1, // TO DO - PENDING JON'S SAVING DATA
        savingTwentyFiveYear: -1, // TO DO - PENDING JON'S SAVING DATA
        deposit: 0, // TO DO - Assuming  0 for now. TO CHECK WITH SALES TEAM ON THE DEPOSIT AMOUNT FOR ESA
      },
    };
    getEcomSystemDesignAndQuoteResponse.paymentOptionData.push(essentialBackupPaymentOptionDataDtoInst);

    const whBackupPaymentOptionDataDtoInst: PaymentOptionDataDto = {
      paymentType: PAYMENT_TYPE.LEASE_WHOLE_HOME_BACKUP,
      paymentDetail: {
        monthlyPaymentAmount: monthlyEsaAmountForWholeHomeBackup,
        savingsFiveYear: -1, // TO DO - PENDING JON'S SAVING DATA
        savingTwentyFiveYear: -1, // TO DO - PENDING JON'S SAVING DATA
        deposit: 0, // TO DO - Assuming  0 for now. TO CHECK WITH SALES TEAM ON THE DEPOSIT AMOUNT FOR ESA
      },
    };

    getEcomSystemDesignAndQuoteResponse.paymentOptionData.push(whBackupPaymentOptionDataDtoInst);

    return OperationResult.ok(getEcomSystemDesignAndQuoteResponse);
  }
}
