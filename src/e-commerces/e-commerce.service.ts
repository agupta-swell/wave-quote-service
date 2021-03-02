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
import { ECOM_PRODUCT_TYPE, PAYMENT_TYPE, ENERGY_SERVICE_TYPE } from './constants';
import { GetEcomSystemDesignAndQuoteReq } from './req/get-ecom-system-design-and-quote.dto';
import { GetEcomSystemDesignAndQuoteDto } from './res/get-ecom-system-design-and-quote.dto';
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
//import { IDetailedQuoteSchema, ILoanProductAttributes } from 'src/quotes/quote.schema';
import { LoanProductAttributesDto } from 'src/quotes/req/sub-dto/loan-product-attributes.dto';
import { CalculationService } from 'src/quotes/sub-services/calculation.service';
import { CalculateQuoteDetailDto } from 'src/quotes/req/calculate-quote-detail.dto'
import { PaymentOptionDataDto, CostDetailDataDto } from './res/sub-dto';


@Injectable()
export class ECommerceService {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly leaseSolverConfigService: LeaseSolverConfigService,
    private readonly systemProductService: SystemProductService,
    private readonly externalService: ExternalService,
    private readonly calculationService: CalculationService,
    @InjectModel(E_COMMERCE_CONFIG) private readonly eCommerceConfigModel: Model<ECommerceConfig>,
    @InjectModel(REGION) private readonly regionModel: Model<Region>,
    @InjectModel(ZIP_CODE_REGION_MAP) private readonly zipCodeRegionMapModel: Model<ZipCodeRegionMap>,
    @InjectModel(E_COMMERCE_PRODUCT) private readonly eCommerceProductModel: Model<ECommerceProduct>,
    @InjectModel(E_COMMERCE_SYSTEM_DESIGN) private readonly eCommerceSystemDesignModel: Model<ECommerceSystemDesign>,
  ) {}

  async getData(req: GetEcomSystemDesignAndQuoteReq): Promise<OperationResult<GetEcomSystemDesignAndQuoteDto>> {
    const {
      addressDataDetail: { lat, long, zip: zipCode },
      monthlyUtilityBill,
      ecomReferenceId,
      depositAmount      
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
    if(!foundZipCode){ //CODE ADDED BY HARI  
      TAHNG TO DO
      //SEND EMAIL TO WAVE SUPPORT TEAM. EMAIL BODY: 'eCommerce system request for zip code [' +  zipCode   + '] could not be fulfilled as the ZIP code could not be mapped to a region.' // EMAIL SUBJECT : 'Undefined Zipcode Mapping [' + zipCode + ']'
      //RETURN ERROR 'No detail available for zip code'
    }
    const foundRegion = await this.regionModel.findById(foundZipCode.region_id);
    if(!foundRegion){ //CODE ADDED BY HARI  
      TAHNG TO DO
      //SEND EMAIL TO WAVE SUPPORT TEAM. EMAIL BODY: 'eCommerce system request for zip code [' +  zipCode   + '] could not be fulfilled as the REGION code could not be mapped to a region.' // EMAIL SUBJECT : 'Undefined region Mapping [' + foundZipCode.region_id + ']'
      //RETURN ERROR 'No detail available for zip code'
    }
    const foundECommerceConfig = await this.eCommerceConfigModel.findOne({ region_id: foundRegion._id });
    const { design_factor, loan_terms_in_months, loan_interest_rate, module_price_per_watt, storage_price, labor_cost_perWatt } = foundECommerceConfig;
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


    //REMOVE THIS COMMENT - BELOW SECTION ADDED BY HARI. THANG TO REVIEW BELOW CODE AND TAKE OWNERSHIP 
    //REMOVE THIS COMMENT - BELOW SECTION ADDED BY HARI. THANG TO REVIEW BELOW CODE AND TAKE OWNERSHIP 
    //REMOVE THIS COMMENT - BELOW SECTION ADDED BY HARI. THANG TO REVIEW BELOW CODE AND TAKE OWNERSHIP 
    //REMOVE THIS COMMENT - BELOW SECTION ADDED BY HARI. THANG TO REVIEW BELOW CODE AND TAKE OWNERSHIP 
    //REMOVE THIS COMMENT - BELOW SECTION ADDED BY HARI. THANG TO REVIEW BELOW CODE AND TAKE OWNERSHIP 
    //REMOVE THIS COMMENT - BELOW SECTION ADDED BY HARI. THANG TO REVIEW BELOW CODE AND TAKE OWNERSHIP 
    //REMOVE THIS COMMENT - BELOW SECTION ADDED BY HARI. THANG TO REVIEW BELOW CODE AND TAKE OWNERSHIP 
    //REMOVE THIS COMMENT - BELOW SECTION ADDED BY HARI. THANG TO REVIEW BELOW CODE AND TAKE OWNERSHIP 

    //QUOTE CALCULATION SECTION
    var regionId : string;
    regionId = '1000'; //TO DO: DELETE THIS LINE AFTER IMPLEMENTING THE ABOVE LOGIC. FOR NOW, ASSUMING 1000 AS THE VALUE TO MOVE FORWARD
    var laborCost : number = requiredpVGeneration * labor_cost_perWatt ; // LOGIC TO BE VALIDATED WITH SALES TEAM
    var overAllCost : number = requiredpVGeneration * module_price_per_watt + numberOfBatteries * storage_price + laborCost //TO DO: THIS LOGIC NEEDS TO BE VALIDATED WITH BUSINESS, ESPECIALLY THE  STORAGE COST CALCULATIONS AND THE LABOR COST CALCULATIONS.


   //BUILD ECOM SYSTEM DESIGN OBJECT
   var ecomSystemDesign : ECommerceSystemDesign;
   ecomSystemDesign.e_com_reference_id = ecomReferenceId;
   ecomSystemDesign.system_design_product.number_of_modules = numberOfPanels;
   ecomSystemDesign.system_design_product.number_of_batteries = numberOfBatteries;
   ecomSystemDesign.system_design_product.total_labor_cost = laborCost;
   ecomSystemDesign.system_design_product.total_cost = overAllCost;
   ecomSystemDesign.system_design_product.ecom_config_snapshot = foundECommerceConfig;
   ecomSystemDesign.system_design_product.ecom_products_snapshotDate = <currentDateTime>;
   ecomSystemDesign.system_design_product.ecom_products_snapshot = <snapshot of ALL records from v2_ecomProducts data>;
   ecomSystemDesign.system_design_product.ecom_products_snapshotDate = <currentDateTime>;

    //CALCULATE LOAN AMOUNT USING WAVE 2.0
    //>>>>>>>>>>>> HARI : QUESTION TO THANG: LOOKS LIKE CalculationService.calculateLoanSolver ACCEPTS UpdateQuoteDto, AN api PAYLOAD) AS PARAMETERS. IS THERE A SPECIFIC REASON WHY IT SHOULD ACCEPT THE API PAYLOD INSTEAD OF SAY 'IDetailedQuoteSchema'

    /*
    var detailedQuoteDataInst : IDetailedQuoteSchema;
    detailedQuoteDataInst.system_production.capacityKW = numberOfPanels * panelSTCRating;
    detailedQuoteDataInst.quote_price_per_watt = module_price_per_watt;
    detailedQuoteDataInst.quote_finance_product.finance_product.product_type = "LOAN"; THANG TO VALIDATE IF THIS HANDLING OF ENUM IS CORRECT
    var ILoanProductAttributesInst : ILoanProductAttributes;
    ILoanProductAttributesInst.upfront_payment = depositAmount;
    ILoanProductAttributesInst.loan_amount = overAllCost - depositAmount;
    ILoanProductAttributesInst.interest_rate = loan_interest_rate;
    ILoanProductAttributesInst.loan_term = loan_terms_in_months;
    ILoanProductAttributesInst.reinvestment = null;
    ILoanProductAttributesInst.tax_credit_prepayment_amount = 0;
    detailedQuoteDataInst.quote_finance_product.finance_product.product_attribute = ILoanProductAttributesInst;
    detailedQuoteDataResponse : detailedQuoteData =   calculationService.calculateLoanSolver(detailedQuoteDataInst) 
    */


    var CalculateQuoteDetailDtoInst : CalculateQuoteDetailDto; 
    CalculateQuoteDetailDtoInst.systemProduction.capacityKW = numberOfPanels * panelSTCRating;
    CalculateQuoteDetailDtoInst.quotePricePerWatt = module_price_per_watt;
    CalculateQuoteDetailDtoInst.quoteFinanceProduct.financeProduct.productType = "LOAN"; //>>>>>>>>>>>> HARI :THANG TO VALIDATE IF THIS HANDLING OF ENUM IS CORRECT
    var LoanProductAttributesDtoInst : LoanProductAttributesDto;
    LoanProductAttributesDtoInst.upfrontPayment = depositAmount;
    LoanProductAttributesDtoInst.loanAmount = overAllCost - depositAmount;
    LoanProductAttributesDtoInst.interestRate = loan_interest_rate;
    LoanProductAttributesDtoInst.loanTerm = loan_terms_in_months;
    LoanProductAttributesDtoInst.reinvestment = null;
    CalculateQuoteDetailDtoInst.quoteFinanceProduct.financeProduct.productAttribute = LoanProductAttributesDtoInst;
    var CalculateQuoteDetailDtoResponse : CalculateQuoteDetailDto =   await this.calculationService.calculateLoanSolver(CalculateQuoteDetailDtoInst, 0 );     //>>>>>>>>>>>> HARI : QUESTION TO THANG: WHAT IS THE SECOND PARAMETER TO THE calculateLoanSolver 'monthlyUtilityPayment'?


    var getEcomSystemDesignAndQuoteResponseInst : GetEcomSystemDesignAndQuoteDto;

    var loanPaymentOptionDataDtoInst : PaymentOptionDataDto;
    loanPaymentOptionDataDtoInst.paymentType = PAYMENT_TYPE.LOAN; 
    loanPaymentOptionDataDtoInst.paymentDetail.monthlyPaymentAmount = (<LoanProductAttributesDto>CalculateQuoteDetailDtoResponse.quoteFinanceProduct.financeProduct.productAttribute).monthlyLoanPayment;
    loanPaymentOptionDataDtoInst.paymentDetail.savingsFiveYear = 0; //NOTE: TODO - PENDING JON'S SAVING DATA
    loanPaymentOptionDataDtoInst.paymentDetail.savingTwentyFiveYear = 0; //NOTE: TODO - PENDING JON'S SAVING DATA
    loanPaymentOptionDataDtoInst.paymentDetail.deposit = depositAmount;
    getEcomSystemDesignAndQuoteResponseInst.paymentOptionData.push(loanPaymentOptionDataDtoInst);


    // SET THE CASH QUOTE DETAILS
    var cashPaymentOptionDataDtoInst : PaymentOptionDataDto;
    cashPaymentOptionDataDtoInst.paymentType = PAYMENT_TYPE.CASH;
    cashPaymentOptionDataDtoInst.paymentDetail.monthlyPaymentAmount = overAllCost - depositAmount;
    cashPaymentOptionDataDtoInst.paymentDetail.savingsFiveYear = 0; //NOTE: TODO - PENDING JON'S SAVING DATA
    cashPaymentOptionDataDtoInst.paymentDetail.savingTwentyFiveYear = 0; //NOTE: TODO - PENDING JON'S SAVING DATA
    cashPaymentOptionDataDtoInst.paymentDetail.deposit = depositAmount;
    getEcomSystemDesignAndQuoteResponseInst.paymentOptionData.push(cashPaymentOptionDataDtoInst);

    //CALCULATE THE LEASE AMOUNT USING WAVE 2.0 QUOTE
    var rateEscalator : number = 2.9; //"Rate escalator is currently assumed to be 2.9"
    var contractTerm : number = 25; //"Contract term is currently assumed to be 25"
    var utilityProgramName : string = 'none';
    //LEASE FOR ESSENTIAL BACKUP
    var pricePerWattForEssentialBackup = overAllCost / netGenerationKWh;
    var monthlyEsaAmountForEssentialBackup : number =   await this.calculationService.calculateLeaseQuoteForECom( true, false, overAllCost, contractTerm,  1, netGenerationKWh, rateEscalator, systemProduction.productivity, false, utilityProgramName ); 

    //LEASE FOR WHOLE HOME BACKUP
    var overallCostForWholeHomeBackup : number = overAllCost + (1 * storage_price) //Add 1 battery additional on top of essential backup
    var pricePerWattForWholeHomeBackup : number = overallCostForWholeHomeBackup / netGenerationKWh
    var monthlyEsaAmountForWholeHomeBackup : number =   await this.calculationService.calculateLeaseQuoteForECom(   true, false, overallCostForWholeHomeBackup, contractTerm,  2, netGenerationKWh, rateEscalator, systemProduction.productivity, false, utilityProgramName );

    //BUILD getEcomSystemDesignAndQuote RESPONSE FOR QUOTE OPTIONS

    getEcomSystemDesignAndQuoteResponseInst.pvModuleDetailData.systemKw = numberOfPanels * panelSTCRating;
    getEcomSystemDesignAndQuoteResponseInst.pvModuleDetailData.percentageOfSelfPower = 0; // TO DO: CALCULATION TBD
    getEcomSystemDesignAndQuoteResponseInst.pvModuleDetailData.percentageOfSelfPower = 0; // TO DO: CALCULATION TBD
    getEcomSystemDesignAndQuoteResponseInst.pvModuleDetailData.estimatedTwentyFiveYearsSavings = 0; // TO DO:  CALCULATION TBD - PENDING JON'S SAVING DATA
    getEcomSystemDesignAndQuoteResponseInst.storageSystemDetailData.storageSystemCount = numberOfBatteries;
    getEcomSystemDesignAndQuoteResponseInst.storageSystemDetailData.storageSystemKwh = numberOfBatteries * storagePerBatteryInkWh;
    getEcomSystemDesignAndQuoteResponseInst.storageSystemDetailData.numberOfDaysBackup = 0; // TO DO: CALCULATION TBD


    var essentialBackupCostDetailDataDtoInst : CostDetailDataDto;
    essentialBackupCostDetailDataDtoInst.energyServiceType = ENERGY_SERVICE_TYPE.SWELL_ESA_ESSENTIAL_BACKUP;
    essentialBackupCostDetailDataDtoInst.quoteDetail.monthlyCost = monthlyEsaAmountForEssentialBackup;
    essentialBackupCostDetailDataDtoInst.quoteDetail.pricePerWatt = pricePerWattForEssentialBackup;
    essentialBackupCostDetailDataDtoInst.quoteDetail.estimatedIncrease = null; // TO DO: CALCULATION TBD
    essentialBackupCostDetailDataDtoInst.quoteDetail.estimatedBillInTenYears = 0; // TO DO:  CALCULATION TBD - PENDING JON'S SAVING DATA
    essentialBackupCostDetailDataDtoInst.quoteDetail.cumulativeSavingsOverTwentyFiveYears = 0; // TO DO:  CALCULATION TBD - PENDING JON'S SAVING DATA
    getEcomSystemDesignAndQuoteResponseInst.costDetailsData.push(essentialBackupCostDetailDataDtoInst);


    var whBackupCostDetailDataDtoInst : CostDetailDataDto;
    whBackupCostDetailDataDtoInst.energyServiceType = ENERGY_SERVICE_TYPE.SWELL_ESA_WHOLE_HOME;
    whBackupCostDetailDataDtoInst.quoteDetail.monthlyCost = monthlyEsaAmountForWholeHomeBackup;
    whBackupCostDetailDataDtoInst.quoteDetail.pricePerWatt = pricePerWattForWholeHomeBackup;
    whBackupCostDetailDataDtoInst.quoteDetail.estimatedIncrease = null; // TO DO: CALCULATION TBD
    whBackupCostDetailDataDtoInst.quoteDetail.estimatedBillInTenYears = 0; // TO DO:  CALCULATION TBD - PENDING JON'S SAVING DATA
    whBackupCostDetailDataDtoInst.quoteDetail.cumulativeSavingsOverTwentyFiveYears = 0; // TO DO:  CALCULATION TBD - PENDING JON'S SAVING DATA
    getEcomSystemDesignAndQuoteResponseInst.costDetailsData.push(whBackupCostDetailDataDtoInst);


    // SET THE QUOTE FOR ESSENTIAL BACKUP AND WHOLE HOME PACKUP
    var essentialBackupPaymentOptionDataDtoInst : PaymentOptionDataDto;
    essentialBackupPaymentOptionDataDtoInst.paymentType = PAYMENT_TYPE.LEASE_ESSENTIAL_BACKUP;
    essentialBackupPaymentOptionDataDtoInst.paymentDetail.monthlyPaymentAmount = monthlyEsaAmountForEssentialBackup;
    essentialBackupPaymentOptionDataDtoInst.paymentDetail.savingsFiveYear = 0; //NOTE: TO DO - PENDING JON'S SAVING DATA
    essentialBackupPaymentOptionDataDtoInst.paymentDetail.savingTwentyFiveYear = 0; //NOTE: TO DO - PENDING JON'S SAVING DATA
    essentialBackupPaymentOptionDataDtoInst.paymentDetail.deposit = 0;//NOTE: TO DO - Assuming  0 for now. TO CHECK WITH SALES TEAM ON THE DEPOSIT AMOUNT FOR ESA
    getEcomSystemDesignAndQuoteResponseInst.paymentOptionData.push(essentialBackupPaymentOptionDataDtoInst);

    var whBackupPaymentOptionDataDtoInst : PaymentOptionDataDto;
    whBackupPaymentOptionDataDtoInst.paymentType = PAYMENT_TYPE.LEASE_WHOLE_HOME_BACKUP;
    whBackupPaymentOptionDataDtoInst.paymentDetail.monthlyPaymentAmount = monthlyEsaAmountForWholeHomeBackup;
    whBackupPaymentOptionDataDtoInst.paymentDetail.savingsFiveYear = 0; //NOTE: TO DO - PENDING JON'S SAVING DATA
    whBackupPaymentOptionDataDtoInst.paymentDetail.savingTwentyFiveYear = 0; //NOTE: TO DO - PENDING JON'S SAVING DATA
    whBackupPaymentOptionDataDtoInst.paymentDetail.deposit = 0;//NOTE: TO DO - Assuming  0 for now. TO CHECK WITH SALES TEAM ON THE DEPOSIT AMOUNT FOR ESA
    getEcomSystemDesignAndQuoteResponseInst.paymentOptionData.push(whBackupPaymentOptionDataDtoInst);


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
