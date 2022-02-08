import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { Cache } from 'cache-manager';
import { ApplicationException } from 'src/app/app.exception';
import { EmailService } from 'src/emails/email.service';
import { FINANCE_PRODUCT_TYPE } from 'src/quotes/constants';
import { CalculateQuoteDetailDto } from 'src/quotes/req/calculate-quote-detail.dto';
import { LoanProductAttributesDto } from 'src/quotes/req/sub-dto/loan-product-attributes.dto';
import { CalculationService } from 'src/quotes/sub-services/calculation.service';
import { SystemProductService } from 'src/system-designs/sub-services';
import { CALCULATION_MODE } from 'src/utilities/constants';
import { CostDataDto, UtilityDataDto } from 'src/utilities/res';
import { ITypicalUsage } from 'src/utilities/utility.schema';
import { UtilityService } from 'src/utilities/utility.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { OperationResult } from '../app/common';
import { ECOM_PRODUCT_TYPE, ENERGY_SERVICE_TYPE, PAYMENT_TYPE } from './constants';
import { GeneratedSolarSystem } from './models/generated-solar-system';
import { TypicalUsage } from './models/typical-usage';
import { GetEcomSystemDesignAndQuoteReq } from './req/get-ecom-system-design-and-quote.dto';
import { GetGeneratedSystemStorageQuoteDto } from './res/get-generated-system-storage-quote.dto';
import { CostDetailDataDto, PaymentOptionDataDto, SolarStorageQuoteDto, StorageQuoteDto } from './res/sub-dto';
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
import { GetEcomStorageOnlyQuoteReq } from './req/get-ecom-storage-only-quote.dto';
import { GetStorageOnlyQuoteDto } from './res/get-storage-only-quote.dto';

@Injectable()
export class ECommerceService {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly systemProductService: SystemProductService,
    private readonly calculationService: CalculationService,
    private readonly emailService: EmailService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectModel(E_COMMERCE_CONFIG) private readonly eCommerceConfigModel: Model<ECommerceConfig>,
    @InjectModel(REGION) private readonly regionModel: Model<Region>,
    @InjectModel(ZIP_CODE_REGION_MAP) private readonly zipCodeRegionMapModel: Model<ZipCodeRegionMap>,
    @InjectModel(E_COMMERCE_PRODUCT) private readonly eCommerceProductModel: Model<ECommerceProduct>,
    @InjectModel(E_COMMERCE_SYSTEM_DESIGN) private readonly eCommerceSystemDesignModel: Model<ECommerceSystemDesign>,
  ) {}

  public async getGeneratedSystemAndQuote(req: GetEcomSystemDesignAndQuoteReq) {
    try {
      const { zip, lat, long } = req.addressDataDetail;

      const deposit = req.depositAmount;

      // Specify how many panels we want to allow the user to add or remove
      const panelVariance = 5;
      // Total number of solar systems to generate
      const numberOfSystemsToGenerate = panelVariance * 2 + 1;

      // Get the typical baseline power usage for the user
      const typicalUsage = await this.getTypicalUsage(zip, req.monthlyUtilityBill);

      // Get the low and high end (+/- panelVariance) systems
      const [lowEndSystem, highEndSystem] = await Promise.all([
        this.generateSolarSystem(zip, typicalUsage, panelVariance * -1),
        this.generateSolarSystem(zip, typicalUsage, panelVariance),
      ]);
      // const highEndSystem = await this.generateSolarSystem(zip, typicalUsage, panelVariance);

      // Calculate the net generation for the low and high end systems -- we can linearly interpolate the rest
      const [lowEndNet, highEndNet] = await Promise.all([
        this.getNetGeneration(lat, long, lowEndSystem.capacityKW),
        this.getNetGeneration(lat, long, highEndSystem.capacityKW),
      ]);

      const lowEndProductivity = lowEndNet / lowEndSystem.capacityKW;
      const highEndProductivity = highEndNet / highEndSystem.capacityKW;

      const [lowEndQuote, highEndQuote] = await Promise.all([
        this.getSolarStorageQuoteDto(zip, lowEndSystem, lowEndProductivity, false, deposit),
        this.getSolarStorageQuoteDto(zip, highEndSystem, highEndProductivity, false, deposit),
      ]);

      const isValidQuote = (quote: SolarStorageQuoteDto) => {
        const isValid = quote.storageData.every(s =>
          s.paymentOptionData.every(p => p.paymentDetail.monthlyPaymentAmount > 0),
        );

        if (!isValid) {
          console.warn('Dropping quote, missing payment amount', JSON.stringify(quote));
        }

        return isValid;
      };

      // Generate the variants for the optimal system design
      const systems: SolarStorageQuoteDto[] = [];

      if (isValidQuote(lowEndQuote)) {
        systems.push(lowEndQuote);
      }

      if (isValidQuote(highEndQuote)) {
        systems.push(highEndQuote);
      }

      const panelCounts: number[] = [];
      for (
        let panelCountAdjust = panelVariance * -1 + 1;
        panelCountAdjust <= panelVariance - 1;
        panelCountAdjust += 1
      ) {
        panelCounts.push(panelCountAdjust);
      }

      await Promise.all(
        panelCounts.map(async panelCountAdjust => {
          const systemIndex = panelCountAdjust + panelVariance;
          const variantSystem = await this.generateSolarSystem(zip, typicalUsage, panelCountAdjust);
          const approximateNetGeneration = this.lerp(
            lowEndNet,
            highEndNet,
            systemIndex / (numberOfSystemsToGenerate - 1),
          );
          const systemProductivity = approximateNetGeneration / variantSystem.capacityKW;
          const isOptimalSystem = panelCountAdjust === 0;
          const quote = await this.getSolarStorageQuoteDto(
            zip,
            variantSystem,
            systemProductivity,
            isOptimalSystem,
            deposit,
          );

          // If we have invalid amounts, drop it from the response (like if Lease Solver wasn't found)
          if (isValidQuote(quote)) {
            systems.push(quote);
          }
        }),
      );

      const typicalUsageCostPerKWh = typicalUsage.typicalAnnualUsageInKwh
        ? typicalUsage.typicalAnnualCost / typicalUsage.typicalAnnualUsageInKwh
        : 0;

      const result: GetGeneratedSystemStorageQuoteDto = {
        solarStorageQuotes: systems,
        typicalUsageCostPerKWh,
      };

      return OperationResult.ok(result);
    } catch (e) {
      console.log(e);
      throw new Error();
    }
  }

  public async getStorageOnlyQuote(req: GetEcomStorageOnlyQuoteReq) {
    const { zip } = req.addressDataDetail;
    const deposit = req.depositAmount;

    // Generate the variants for storage count
    const quotes = await Promise.all(
      Array.from({ length: 3 }, async (_, i) => this.getStorageQuoteDto(zip, deposit, 0, i + 1, 0, 0)),
    );

    const result: GetStorageOnlyQuoteDto = {
      storageData: quotes,
    };

    return OperationResult.ok(result);
  }

  private async getTypicalUsage(zipCode: number, monthlyUtilityBill: number): Promise<TypicalUsage> {
    const utilityDataInst = strictPlainToClass(UtilityDataDto, {});
    const costDataInst = strictPlainToClass(CostDataDto, {});

    const [utilityTariffDataModel, typicalBaselineModel] = await Promise.all([
      this.utilityService.getTariffs(zipCode),
      this.utilityService.getTypicalBaseline(zipCode, true),
    ]);

    const utilityTariffDataInst = utilityTariffDataModel.data;
    const typicalBaselineInst = typicalBaselineModel.data;

    utilityDataInst.typicalBaselineUsage = typicalBaselineInst?.typicalBaselineUsage || ({} as any);

    const utilityTypicalCostDataInst = await this.utilityService.calculateCost(
      (typicalBaselineInst?.typicalBaselineUsage?.typicalHourlyUsage || []).map(i => i.v),
      utilityTariffDataInst?.tariffDetails[0].masterTariffId || '',
      CALCULATION_MODE.TYPICAL,
      new Date().getFullYear(),
      zipCode,
    );

    costDataInst.masterTariffId = utilityTariffDataInst?.tariffDetails[0].masterTariffId || '';
    costDataInst.typicalUsageCost = <any>utilityTypicalCostDataInst;

    // TODO: January as 0, December as 11
    // in lucidchart, we substract 2 but this dayjs count January equal 0 hence we just write 1 in subtract function of dayjs
    // const monthToAdjust = dayjs().subtract(1, 'month').get('month'); // ASSUME THE AMOUNT ENTERED BY THE USER IS TWO MONTH OLDER
    // const deltaValueRatio =
    //   (monthlyUtilityBill - (utilityTypicalCostDataInst.cost?.find(item => item.i === monthToAdjust)?.v || 0)) /
    //   monthlyUtilityBill;

    const typicalAnnualCost = utilityTypicalCostDataInst.cost?.reduce((acc, item) => {
      acc += item.v;
      return acc;
    }, 0);

    const typicalAnnualUsageInKwh = typicalBaselineInst?.typicalBaselineUsage.typicalMonthlyUsage.reduce(
      (acc, item) => {
        acc += item.v;
        return acc;
      },
      0,
    );

    const typicalCostAvg = typicalAnnualCost / 12;
    const deltaValueRatio = monthlyUtilityBill / typicalCostAvg;
    const actualMonthlyUsage: ITypicalUsage[] = [];
    let annualUsage = 0;

    typicalBaselineInst?.typicalBaselineUsage.typicalMonthlyUsage.forEach(item => {
      actualMonthlyUsage.push({ i: item.i, v: item.v * (1 + deltaValueRatio) });
      annualUsage += item.v * deltaValueRatio;
    });

    utilityDataInst.actualUsage = utilityDataInst.actualUsage || {};
    utilityDataInst.actualUsage.monthlyUsage = actualMonthlyUsage;

    const actualCostDataInst = (
      await this.utilityService.calculateActualUsageCost({
        masterTariffId: utilityTariffDataInst?.tariffDetails[0].masterTariffId || '',
        zipCode,
        utilityData: utilityDataInst,
      })
    ).data?.actualUsageCost;

    costDataInst.actualUsageCost = actualCostDataInst || undefined;

    return {
      annualUsage,
      typicalAnnualCost,
      typicalAnnualUsageInKwh,
    };
  }

  private async generateSolarSystem(
    zipCode: number,
    usage: TypicalUsage,
    additionalPanels = 0,
  ): Promise<GeneratedSolarSystem> {
    const [foundECommerceConfig, foundEComProduct] = await Promise.all([
      this.getEcommerceConfig(zipCode),
      this.getPanelProduct(),
    ]);

    const { designFactor } = foundECommerceConfig;

    const requiredpVGeneration = usage.annualUsage / designFactor;
    const panelSTCRating = foundEComProduct?.sizeW || 1;
    const numberOfPanels = Math.ceil((requiredpVGeneration * 1000) / panelSTCRating) + additionalPanels;

    return new GeneratedSolarSystem(numberOfPanels, panelSTCRating);
  }

  private async getLoanPaymentOptionDetails(
    zipCode: number,
    overallCost: number,
    depositAmount: number,
    systemCapacityKW: number,
  ): Promise<PaymentOptionDataDto> {
    const foundECommerceConfig = await this.getEcommerceConfig(zipCode);
    const { loanTermsInMonths, loanInterestRate, loanDealerFee } = foundECommerceConfig;
    const calculateQuoteDetailDto: CalculateQuoteDetailDto = {
      quoteId: '',
      systemProduction: {} as any,
      utilityProgram: {} as any,
      quoteFinanceProduct: {
        financeProduct: {} as any,
      },
    } as any;
    calculateQuoteDetailDto.systemProduction.capacityKW = systemCapacityKW;
    calculateQuoteDetailDto.quoteFinanceProduct.financeProduct.productType = FINANCE_PRODUCT_TYPE.LOAN;
    const loanProductAttributesDto: LoanProductAttributesDto = {} as any;
    loanProductAttributesDto.upfrontPayment = depositAmount;
    loanProductAttributesDto.loanAmount = overallCost - depositAmount;
    loanProductAttributesDto.interestRate = loanInterestRate;
    loanProductAttributesDto.loanTerm = loanTermsInMonths;
    loanProductAttributesDto.reinvestment = null as any;
    loanProductAttributesDto.loanStartDate = new Date(new Date().setDate(15)).getTime();
    // Do not include a dealer fee for storage-only
    loanProductAttributesDto.dealerFee = systemCapacityKW > 0 ? loanDealerFee : 0;
    calculateQuoteDetailDto.quoteFinanceProduct.financeProduct.productAttribute = loanProductAttributesDto;

    const calculateQuoteDetailDtoResponse = await this.calculationService.calculateLoanSolver(
      calculateQuoteDetailDto,
      0,
    );

    // Fix: for loans calculated in November or December, we only have at most 2 months in the Year 0
    const loanProductAttributesOut = calculateQuoteDetailDtoResponse.quoteFinanceProduct.financeProduct.productAttribute as any;
    const monthsInYear0 = loanProductAttributesOut.yearlyLoanPaymentDetails[0].monthlyPaymentDetails.length;
    let monthlyPaymentAmount = 0;

    if (monthsInYear0 < 3) {
      monthlyPaymentAmount = loanProductAttributesOut.yearlyLoanPaymentDetails[1].monthlyPaymentDetails[2 - monthsInYear0].monthlyPayment || 0;
    } else {
      monthlyPaymentAmount = loanProductAttributesOut.yearlyLoanPaymentDetails[0].monthlyPaymentDetails[2].monthlyPayment || 0;
    }

    return {
      paymentType: PAYMENT_TYPE.LOAN,
      paymentDetail: {
        monthlyPaymentAmount,
        savingsFiveYear: -1, // NOTE: TODO - PENDING JON'S SAVING DATA
        savingTwentyFiveYear: -1, // NOTE: TODO - PENDING JON'S SAVING DATA
        deposit: depositAmount,
      },
    };
  }

  private async getCashPaymentOptionDetails(overallCost: number, depositAmount: number): Promise<PaymentOptionDataDto> {
    return {
      paymentType: PAYMENT_TYPE.CASH,
      paymentDetail: {
        monthlyPaymentAmount: overallCost - depositAmount,
        savingsFiveYear: -1, // NOTE: TODO - PENDING JON'S SAVING DATA
        savingTwentyFiveYear: -1, // NOTE: TODO - PENDING JON'S SAVING DATA
        deposit: depositAmount,
      },
    };
  }

  private async getLeaseDetails(
    zipCode: number,
    overallCost: number,
    numberOfBatteries: number,
    systemCapacityKW: number,
    systemProductivity: number,
  ) {
    const [ecomConfig, foundBattery] = await Promise.all([
      await this.getEcommerceConfig(zipCode),
      this.getBatteryProduct(),
    ]);
    const storagePerBatteryInkWh = (foundBattery?.sizeW ?? 0) / 1000;
    const totalStorageRequested = storagePerBatteryInkWh * numberOfBatteries;
    const rateEscalator = ecomConfig.esaRateEscalator; // "Rate escalator is currently assumed to be 2.9"
    const contractTerm = ecomConfig.esaContractTermInYears; // "Contract term is currently assumed to be 25"
    const utilityProgramName = ecomConfig?.esaUtilityProgramName || 'None';

    // LEASE FOR ESSENTIAL BACKUP
    // const pricePerKwhForEssentialBackup = overAllCost / systemProduction.capacityKW / 1000;
    const {
      monthlyLeasePayment,
      ratePerKWh,
      ratePerKWhWithStorage,
    } = await this.calculationService.calculateLeaseQuoteForECom(
      true,
      false,
      overallCost,
      contractTerm,
      totalStorageRequested,
      systemCapacityKW,
      rateEscalator,
      systemProductivity,
      false,
      utilityProgramName,
    );

    if (monthlyLeasePayment === -1) {
      const subject = `Lease Solver Config Not Found in E Commerce`;
      const body = `Lease Solver Config Not Found in E Commerce with these conditions:
        isSolar:${true},
        isRetrofit:${false},
        utilityProgramName: ${utilityProgramName},
        contractTerm:${contractTerm},
        storageSize:${totalStorageRequested},
        rateEscalator:${rateEscalator},
        capacityKW:${systemCapacityKW},
        productivity:${systemProductivity},
      `;

      console.log(body);
      await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);
    }

    const costDetail: CostDetailDataDto = {
      energyServiceType: this.getLeaseEnergyServiceTypeByBatteryCount(numberOfBatteries),
      quoteDetail: {
        monthlyCost: monthlyLeasePayment,
        pricePerKwh: ratePerKWh,
        pricePerKwhWithStorage: ratePerKWhWithStorage,
        estimatedIncrease: rateEscalator,
        estimatedBillInTenYears: monthlyLeasePayment * Math.pow(1 + rateEscalator / 100, 10),
        cumulativeSavingsOverTwentyFiveYears: -1, // TO DO:  CALCULATION TBD - PENDING JON'S SAVING DATA
      },
    };

    const paymentOption: PaymentOptionDataDto = {
      paymentType: this.getLeasePaymentTypeByBatteryCount(numberOfBatteries),
      paymentDetail: {
        monthlyPaymentAmount: monthlyLeasePayment,
        savingsFiveYear: -1, // TO DO - PENDING JON'S SAVING DATA
        savingTwentyFiveYear: -1, // TO DO - PENDING JON'S SAVING DATA
        deposit: 0, // TO DO - Assuming  0 for now. TO CHECK WITH SALES TEAM ON THE DEPOSIT AMOUNT FOR ESA
      },
    };

    return {
      costDetail,
      paymentOption,
    };
  }

  private async getEcommerceConfig(zipCode: number): Promise<ECommerceConfig> {
    const cacheKey = `e-commerce.service.getEcommerceConfig.${zipCode}`;
    const cachedResult = await this.cacheManager.get<ECommerceConfig>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const foundZipCode = await this.zipCodeRegionMapModel.findOne({ zipCodes: zipCode });

    if (!foundZipCode) {
      const subject = `Undefined Zipcode Mapping ${zipCode}`;
      const body = `eCommerce system request for zip code ${zipCode} could not be fulfilled as the ZIP code could not be mapped to a region.`;
      await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);

      throw ApplicationException.ServiceError();
    }

    const foundRegion = await this.regionModel.findById(foundZipCode.regionId).lean();
    if (!foundRegion) {
      const subject = `Undefined region Mapping ${foundZipCode.regionId}`;
      const body = `eCommerce system request for zip code ${zipCode} could not be fulfilled as the REGION code could not be mapped to a region.`;
      await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);

      throw ApplicationException.ServiceError();
    }

    const foundECommerceConfig = await this.eCommerceConfigModel.findOne({ regionId: foundRegion._id });
    if (!foundECommerceConfig) {
      const subject = `E Commerce Config does not find with region ${foundRegion._id}`;
      const body = `E Commerce Config does not find with region ${foundRegion._id}`;
      await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);
      throw ApplicationException.EntityNotFound('E Commerce Config');
    }

    await this.cacheManager.set(cacheKey, foundECommerceConfig, 30);

    return foundECommerceConfig;
  }

  private async getPanelProduct() {
    const cacheKey = `e-commerce.service.getPanelProduct`;
    let cachedResult = await this.cacheManager.get<LeanDocument<ECommerceProduct>>(cacheKey);

    if (!cachedResult) {
      cachedResult = await this.eCommerceProductModel.findOne({ type: ECOM_PRODUCT_TYPE.PANEL }).lean();
      if (!cachedResult) {
        const subject = `E Commerce Product does not find with panel type `;
        const body = `E Commerce Product does not find with panel type `;
        await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);
        throw ApplicationException.EntityNotFound('E Commerce Product');
      }

      await this.cacheManager.set(cacheKey, cachedResult, 30);
    }

    return cachedResult;
  }

  private async getBatteryProduct() {
    const cacheKey = `e-commerce.service.getBatteryProduct`;
    let cachedResult = await this.cacheManager.get<LeanDocument<ECommerceProduct>>(cacheKey);

    if (!cachedResult) {
      cachedResult = await this.eCommerceProductModel.findOne({ type: ECOM_PRODUCT_TYPE.BATTERY }).lean();
      if (!cachedResult) {
        const subject = `E Commerce Product does not find with battery type `;
        const body = `E Commerce Product does not find with battery type `;
        await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);
        throw ApplicationException.EntityNotFound('E Commerce Product');
      }

      await this.cacheManager.set(cacheKey, cachedResult, 30);
    }

    return cachedResult;
  }

  private async getTotalCost(zipCode: number, numberOfPanelsToInstall = 0, numberOfBatteries = 0) {
    const foundECommerceConfig = await this.getEcommerceConfig(zipCode);
    
    if (numberOfPanelsToInstall > 0) {
      const solarProduct = await this.getPanelProduct();
      const { 
        modulePricePerWatt,
        moduleLaborPerWatt,
        moduleMarkup,
        storagePrice,
        storageBaseCost,
        storageLaborPerHour,
        storageMarkup
      } = foundECommerceConfig;

      const wattsBeingInstalled = solarProduct.sizeW * numberOfPanelsToInstall;
      const totalCost = this.getTotalCostForSolarSystem(
        modulePricePerWatt,
        moduleLaborPerWatt || 0,
        moduleMarkup,
        storagePrice,
        storageLaborPerHour,
        storageBaseCost,
        storageMarkup,
        wattsBeingInstalled,
        numberOfBatteries
      );

      return totalCost;
    } else {
      const retrofitLookup = foundECommerceConfig.retrofitStoragePrices?.find(
        p => p.batteryCount === numberOfBatteries,
      );

      if (!retrofitLookup) {
        const subject = `E Commerce Config does not have retrofit storage price ${numberOfBatteries}`;
        const body = `E Commerce Config does not have retrofit storage price ${numberOfBatteries}`;
        await this.emailService.sendMail(process.env.SUPPORT_MAIL ?? '', body, subject);
        throw ApplicationException.EntityNotFound('E Commerce Config');
      }

      return retrofitLookup.cost;
    }
  }

  private getNetGeneration(lat: number, long: number, systemCapacityKW: number) {
    const azimuth = 180; // "Assuming a perfect 180 degrees for module placement"
    const tilt = 23; // "Assuming a perfect 23 degrees for pitch"
    const losses = 14.08; // "Assuming a loss factor of 14.08" -- PVWatts default

    return this.systemProductService.pvWatCalculation({
      lat,
      lon: long,
      systemCapacity: systemCapacityKW,
      azimuth,
      tilt,
      losses,
    });
  }

  private getLeaseEnergyServiceTypeByBatteryCount(numberOfBatteries: number) {
    switch (numberOfBatteries) {
      case 0:
        return ENERGY_SERVICE_TYPE.SWELL_ESA_SOLAR_ONLY;
      case 1:
        return ENERGY_SERVICE_TYPE.SWELL_ESA_ESSENTIAL_BACKUP;
      case 2:
        return ENERGY_SERVICE_TYPE.SWELL_ESA_WHOLE_HOME;
      case 3:
        return ENERGY_SERVICE_TYPE.SWELL_ESA_COMPLETE_BACKUP;
      default:
        throw ApplicationException.ServiceError();
    }
  }

  private getLeasePaymentTypeByBatteryCount(numberOfBatteries: number) {
    switch (numberOfBatteries) {
      case 0:
        return PAYMENT_TYPE.LEASE_SOLAR_ONLY;
      case 1:
        return PAYMENT_TYPE.LEASE_ESSENTIAL_BACKUP;
      case 2:
        return PAYMENT_TYPE.LEASE_WHOLE_HOME_BACKUP;
      case 3:
        return PAYMENT_TYPE.LEASE_COMPLETE_BACKUP;
      default:
        throw ApplicationException.ServiceError();
    }
  }

  private async getSolarStorageQuoteDto(
    zipCode: number,
    system: GeneratedSolarSystem,
    systemProductivity: number,
    isDefault: boolean,
    deposit: number,
  ): Promise<SolarStorageQuoteDto> {
    const storageQuotes = await Promise.all(
      [...Array(3)].map((_, idx) =>
        this.getStorageQuoteDto(zipCode, deposit, system.numberOfPanels, idx, system.capacityKW, systemProductivity),
      ),
    );

    return {
      numberOfPanels: system.numberOfPanels,
      isDefault,
      pvModuleDetailData: this.getPvModuleDetailDataDto(system),
      storageData: storageQuotes,
    };
  }

  private async getStorageQuoteDto(
    zipCode: number,
    deposit: number,
    numberOfPanelsToInstall = 0,
    numberOfBatteries = 0,
    systemCapacityKW = 0,
    systemProductivity = 0,
  ): Promise<StorageQuoteDto> {
    const [totalCost, batteryProduct] = await Promise.all([
      this.getTotalCost(zipCode, numberOfPanelsToInstall, numberOfBatteries),
      this.getBatteryProduct(),
    ]);

    const costDetailsData: CostDetailDataDto[] = [];
    const paymentOptionData: PaymentOptionDataDto[] = [];

    if (numberOfPanelsToInstall > 0) {
      const leaseDetails = await this.getLeaseDetails(
        zipCode,
        totalCost,
        numberOfBatteries,
        systemCapacityKW,
        systemProductivity,
      );
      costDetailsData.push(leaseDetails.costDetail);
      paymentOptionData.push(leaseDetails.paymentOption);

      const cashDetails = await this.getCashPaymentOptionDetails(totalCost, deposit);
      paymentOptionData.push(cashDetails);
    }

    const loanDetails = await this.getLoanPaymentOptionDetails(
      zipCode,
      totalCost,
      deposit,
      systemCapacityKW,
    );
    paymentOptionData.push(loanDetails);

    return {
      storageSystemDetailData: {
        storageSystemCount: numberOfBatteries,
        storageSystemKWh: (batteryProduct.sizeW * numberOfBatteries) / 1000,
        numberOfDaysBackup: 0, // TODO: IMPLEMENT THIS
        backupDetailsTest: '', // TODO: IMPLEMENT THIS
      },
      costDetailsData,
      paymentOptionData,
    };
  }

  private getPvModuleDetailDataDto(generatedSystem: GeneratedSolarSystem) {
    return {
      systemKW: generatedSystem.capacityKW,
      percentageOfSelfPower: 0, // PENDING CALCULATION
      estimatedTwentyFiveYearsSavings: 0, // PENDING CALCULATION
    };
  }

  private lerp(start: number, end: number, desired: number) {
    return start * (1.0 - desired) + end * desired;
  }

  private getTotalCostForSolarSystem(
      modulePricePerW: number,
      moduleLaborCost: number,
      moduleMarkupRate: number,
      storagePrice: number,
      storageLaborPerHour: number,
      storageBaseCost: number,
      storageMarkupRate: number,
      systemSizeW: number,
      batteryCount: number
  ) {
    const solarBaseCost = systemSizeW * modulePricePerW;
    const solarLaborCost = systemSizeW * moduleLaborCost;
    const storageBatteryCost = storagePrice * batteryCount;
    const storageLaborCost = storageLaborPerHour * 0; // TODO: If we ever need to support storage labor, it is _per hour_
    const storageBaseActual = batteryCount > 0 ? storageBaseCost : 0;
    const solarSubtotal = solarBaseCost + solarLaborCost;
    const storageSubtotal = storageBatteryCost + storageLaborCost + storageBaseActual;
    const solarMarkup = solarSubtotal * moduleMarkupRate;
    const storageMarkup = storageSubtotal * storageMarkupRate;

    return solarSubtotal + solarMarkup + storageSubtotal + storageMarkup;
  }
}
