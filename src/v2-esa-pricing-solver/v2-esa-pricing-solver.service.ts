import { forwardRef, Inject, Injectable, NotFoundException, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import BigNumber from 'bignumber.js';
import { FilterQuery, LeanDocument, Model } from 'mongoose';
import { parse } from 'papaparse';
import { ApplicationException } from 'src/app/app.exception';
import { DevFeeService } from 'src/dev-fee/dev-fee.service';
import { FinancialProductsService } from 'src/financial-products/financial-product.service';
import { PROJECT_TYPES } from 'src/fmvAppraisal/constant';
import { FmvAppraisalService } from 'src/fmvAppraisal/fmvAppraisal.service';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { Manufacturer, V2_MANUFACTURERS_COLL } from 'src/manufacturers/manufacturer.schema';
import { OPPORTUNITY, Opportunity } from 'src/opportunities/opportunity.schema';
import { PROPERTY_COLLECTION_NAME } from 'src/property/constants';
import { PropertyDocument } from 'src/property/property.schema';
import { QuotePartnerConfigService } from 'src/quote-partner-configs/quote-partner-config.service';
import { IEsaProductAttributes, IQuotePricePerWattSchema, Quote } from 'src/quotes/quote.schema';
import { QuoteService } from 'src/quotes/quote.service';
import { QuoteCostBuildUpService } from 'src/quotes/sub-services';
import { FastifyRequest } from 'src/shared/fastify';
import { IStorageSchema, ISystemProductionSchema, SystemDesign } from 'src/system-designs/system-design.schema';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { UtilitiesMaster, UTILITIES_MASTER } from 'src/utilities-master/utilities-master.schema';
import { UtilityService } from 'src/utilities/utility.service';
import { convertStringWithCommasToNumber } from 'src/utils/common';
import { OperationResult } from '../app/common/operation-result';
import { CSV_PRIMARY_QUOTE, V2_ESA_PRICING_SOLVER_COLLECTION } from './constants';
import { V2EsaPricingCalculation, V2EsaPricingSolver, V2EsaPricingSolverDocument } from './interfaces';

@Injectable()
export class EsaPricingSolverService {
  constructor(
    // @ts-ignore
    @InjectModel(V2_ESA_PRICING_SOLVER_COLLECTION) private esaPricingSolverModel: Model<V2EsaPricingSolverDocument>,
    // @ts-ignore
    @InjectModel(V2_MANUFACTURERS_COLL) private manufacturerModel: Model<Manufacturer>,
    @InjectModel(UTILITIES_MASTER) private utilitiesMasterModel: Model<UtilitiesMaster>,
    // @ts-ignore
    @InjectModel(OPPORTUNITY) private opportunityModel: Model<Opportunity>,
    // @ts-ignore
    @InjectModel(PROPERTY_COLLECTION_NAME) private readonly propertyModel: Model<PropertyDocument>,

    // @ts-ignore
    @Inject(forwardRef(() => QuoteService))
    private readonly quoteService: QuoteService,
    // @ts-ignore
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
    // @ts-ignore
    @Inject(forwardRef(() => FinancialProductsService))
    private readonly financialProductService: FinancialProductsService,
    // @ts-ignore
    @Inject(forwardRef(() => UtilityService))
    private readonly utilityService: UtilityService,
    private readonly quoteCostBuildUpService: QuoteCostBuildUpService,
    private readonly quotePartnerConfigService: QuotePartnerConfigService,
    private readonly fundingSourceService: FundingSourceService,
    private readonly devFeeService: DevFeeService,
    private readonly fmvAppraisalService: FmvAppraisalService,
  ) {}

  async getEcsAndTerm(quoteId: string): Promise<LeanDocument<V2EsaPricingSolverDocument>[]> {
    const filter: FilterQuery<V2EsaPricingSolverDocument> = {};
    const foundQuote = await this.quoteService.getOneFullQuoteDataById(quoteId);

    if (foundQuote) {
      const [opportunity, systemDesign] = await Promise.all([
        this.opportunityModel.findById(foundQuote.opportunityId),
        this.systemDesignService.getOneById(foundQuote.systemDesignId),
      ]);

      if (opportunity && systemDesign) {
        const utilityNameConcatUtilityProgramName = await this.utilityService.getUtilityName(opportunity.utilityId);
        const utilityName = utilityNameConcatUtilityProgramName.split('-')[0].trim();
        const utilityMaster = await this.utilitiesMasterModel.findOne({ utility_name: utilityName }).lean();
        const property = await this.propertyModel.findById(opportunity?.propertyId);

        const designParam = this.getStorageSizeAndManufacturer(systemDesign);
        if (
          property?.state &&
          designParam.storageSize !== undefined &&
          utilityMaster?._id &&
          foundQuote.detailedQuote.primaryQuoteType
        ) {
          filter.state = property.state;
          filter.storageSizeKWh = designParam.storageSize;
          filter.storageManufacturerId = designParam.manufacturerId;
          filter.applicableUtilities = utilityMaster?._id;
          filter.projectTypes = CSV_PRIMARY_QUOTE[foundQuote.detailedQuote.primaryQuoteType];

          const result = await this.esaPricingSolverModel
            .find(filter, { _id: 1, termYears: 1, rateEscalator: 1 })
            .lean();

          return result;
        }
      }
    }
    return [];
  }

  getStorageSizeAndManufacturer(systemDesign: LeanDocument<SystemDesign> | null) {
    const storageSize =
      systemDesign?.roofTopDesignData.storage?.reduce((acc: number, curr: IStorageSchema) => {
        const kwh = curr.storageModelDataSnapshot.ratings.kilowattHours;
        const quantity = curr.quantity;
        if (kwh && quantity) {
          acc += Number(kwh) * Number(quantity);
        }
        return acc;
      }, 0) || 0;

    const manufacturerId = systemDesign?.roofTopDesignData.storage[0]?.storageModelDataSnapshot.manufacturerId;
    return { storageSize, manufacturerId: manufacturerId?.toString() || 'N/A' };
  }

  async getEsaSolverRow(
    opportunityId: string,
    systemDesignId: string,
    partnerId: string,
    fundingSourceId: string,
    financialProductId: string,
    recentQuoteId: string,
  ): Promise<V2EsaPricingSolverDocument> {
    const [systemDesignAndOpportunityParam, recentQuote] = await Promise.all([
      await this.getSystemDesignAndOpportunityParam(
        opportunityId,
        systemDesignId,
        partnerId,
        fundingSourceId,
        financialProductId,
      ),
      this.quoteService.getOneById(recentQuoteId),
    ]);
    const { designParam, opportunityParam } = systemDesignAndOpportunityParam;

    // TO MATCH IN CSV ROW
    const productAttribute = recentQuote?.quoteFinanceProduct.financeProduct.productAttribute as IEsaProductAttributes;
    const rateEscalator = productAttribute.rateEscalator;
    const esaTerm = productAttribute.esaTerm;
    const escAndTerms = { rateEscalator, esaTerm };

    return this.extractRowFromCSV(designParam, opportunityParam, escAndTerms);
  }

  async extractRowFromCSV(
    systemDesign: { storageSize: number; manufacturerId?: string },
    opportunity: { state?: string; systemType: string; applicableUtility: string },
    escAndTerm?: { rateEscalator: number; esaTerm: number },
  ): Promise<V2EsaPricingSolverDocument> {
    const foundRow = await this.esaPricingSolverModel.findOne({
      state: opportunity.state,
      projectTypes: { $in: [opportunity.systemType] },
      rateEscalator: escAndTerm?.rateEscalator,
      termYears: escAndTerm?.esaTerm,
      storageSizeKWh: systemDesign?.storageSize,
      storageManufacturerId: systemDesign.manufacturerId || 'N/A',
      applicableUtilities: { $in: [opportunity.applicableUtility] },
    });

    if (!foundRow) {
      throw new NotFoundException(`No matching solver row.`);
    }

    return foundRow;
  }

  async getSystemDesignAndOpportunityParam(
    opportunityId: string,
    systemDesignId: string,
    partnerId: string,
    fundingSourceId: string,
    financialProductId: string,
  ) {
    const [opportunity, systemDesign, quoteConfigData, fundingSource, financialProduct] = await Promise.all([
      this.opportunityModel.findById(opportunityId),
      this.systemDesignService.getOneById(systemDesignId),
      this.quotePartnerConfigService.getDetailByPartnerId(partnerId),
      this.fundingSourceService.getDetailById(fundingSourceId),
      this.financialProductService.getDetailByFinancialProductId(financialProductId),
    ]);

    const property = await this.propertyModel.findById(opportunity?.propertyId);

    let primaryQuoteType;
    let utilityMaster;

    if (fundingSource && financialProduct && systemDesign && quoteConfigData && opportunity) {
      const dealerFeePercentage = await this.quoteService.getDealerFeePercentage(
        fundingSource.type,
        financialProduct.dealerFee,
      );

      const quoteCostBuildup = this.quoteCostBuildUpService.create({
        roofTopDesignData: systemDesign.roofTopDesignData,
        partnerMarkup: quoteConfigData,
        dealerFeePercentage,
      });
      primaryQuoteType = this.quoteService.getPrimaryQuoteType(quoteCostBuildup, systemDesign.existingSystem);

      const utilityNameConcatUtilityProgramName = await this.utilityService.getUtilityName(opportunity.utilityId);
      const utilityName = utilityNameConcatUtilityProgramName.split('-')[0].trim();
      utilityMaster = await this.utilitiesMasterModel.findOne({ utility_name: utilityName }).lean();
    }

    const state = property?.state;

    const designParam = this.getStorageSizeAndManufacturer(systemDesign);
    const opportunityParam = {
      state,
      systemType: CSV_PRIMARY_QUOTE[primaryQuoteType],
      applicableUtility: utilityMaster?._id,
    };
    return {
      designParam,
      opportunityParam,
    };
  }

  async createDataFromCSV(@Req() req: FastifyRequest): Promise<OperationResult<string>> {
    try {
      const file = await req.file();
      const rawCSV = (await file.toBuffer()).toString().trim() as string;
      const { data } = parse<string[]>(rawCSV);

      const handlers = data.map(async (values, index) => {
        if (index === 0) return;

        const [manufacturer, utilities] = await Promise.all([
          this.manufacturerModel.findOne({ name: values[2] }).lean(),
          this.utilitiesMasterModel.find({ utilityName: { $in: values[4]?.split(';') || [] } }).lean(),
        ]);

        const payload: V2EsaPricingSolver = {
          termYears: convertStringWithCommasToNumber(values[0]),
          storageSizeKWh: convertStringWithCommasToNumber(values[1]),
          storageManufacturerId: manufacturer?._id || 'N/A',
          state: values[3],
          applicableUtilities: utilities.map(item => item._id) || [],
          projectTypes: values[5]?.split('_') || [],
          rateEscalator: new BigNumber(convertStringWithCommasToNumber(values[6])).multipliedBy(100).toNumber(),
          coefficientA: convertStringWithCommasToNumber(values[7]),
          coefficientB: convertStringWithCommasToNumber(values[8]),
          coefficientC: convertStringWithCommasToNumber(values[9]),
          coefficientD: convertStringWithCommasToNumber(values[10]),
          maxPricePerWatt: convertStringWithCommasToNumber(values[11]),
          minPricePerWatt: convertStringWithCommasToNumber(values[12]),
          maxDollarKwhRate: convertStringWithCommasToNumber(values[13]),
          minDollarKwhRate: convertStringWithCommasToNumber(values[14]),
          maxPricePerKwh: convertStringWithCommasToNumber(values[15]),
          minPricePerKwh: convertStringWithCommasToNumber(values[16]),
        };

        const newEsaPricingSolver = new this.esaPricingSolverModel(payload);
        // eslint-disable-next-line consistent-return
        return newEsaPricingSolver.save();
      });

      await Promise.all(handlers);
      return OperationResult.ok('Upload Success!');
    } catch (error) {
      throw ApplicationException.UnprocessableEntity('Upload Failed!');
    }
  }

  async calculateEsaPricing(data: {
    solverId: string;
    fundId: string;
    systemProduction: ISystemProductionSchema;
    fmvAppraisalId: string;
    defaultTurnkeyPriceEsPv: number;
  }): Promise<V2EsaPricingCalculation> {
    const { solverId, fundId, systemProduction, fmvAppraisalId, defaultTurnkeyPriceEsPv } = data;
    const [solverRow, devFee, fmvAppraisal] = await Promise.all([
      this.getSolverRowById(solverId),
      this.getModeledDevFee(fundId),
      this.fmvAppraisalService.findFmvAppraisalById(fmvAppraisalId),
    ]);

    if (!fmvAppraisal) throw ApplicationException.EntityNotFound(`fmvAppraisal data.`);

    const isSolarOnly = solverRow.projectTypes.every(item => item === PROJECT_TYPES.SOLAR);

    // If the db.v2_esa_pricing_solver.projectTypes array contains 'solar', then run the solar/solar+storage calculations.
    // Otherwise, run the storage-only calculations.
    const res = solverRow.projectTypes.some(item => ['solar', 'solar+storage'].includes(item))
      ? this.calculateSolarPlusStorage(
          systemProduction,
          solverRow,
          devFee,
          isSolarOnly,
          fmvAppraisal.storageRatePerKwh,
          defaultTurnkeyPriceEsPv,
        )
      : this.calculateStorageOnly(solverRow, devFee, fmvAppraisal.storageRatePerKwh);

    return res;
  }

  async calculate(quoteId: string): Promise<OperationResult<V2EsaPricingCalculation>> {
    const quote = await this.getQuoteById(quoteId);

    const {
      fmvAppraisalId,
      defaultTurnkeyPriceEsPv,
      fundId,
    } = quote.detailedQuote.quoteFinanceProduct.financeProduct.financialProductSnapshot;

    const res = await this.calculateEsaPricing({
      solverId: quote.solverId,
      fundId,
      systemProduction: quote.detailedQuote.systemProduction,
      fmvAppraisalId,
      defaultTurnkeyPriceEsPv,
    });

    return OperationResult.ok(res);
  }

  calculateSolarPlusStorage(
    systemProduction: ISystemProductionSchema,
    solverRow: V2EsaPricingSolverDocument,
    devFee: number,
    isSolarOnly: boolean,
    storageRatePerKwh: number,
    defaultTurnkeyPriceEsPv: number,
  ): V2EsaPricingCalculation {
    if (!systemProduction) throw ApplicationException.EntityNotFound(`systemProduction data.`);

    const pricePerWatt = isSolarOnly ? storageRatePerKwh / 1000 : defaultTurnkeyPriceEsPv;

    const annualPayment =
      solverRow.coefficientA * (devFee * pricePerWatt * systemProduction.capacityKW) +
      solverRow.coefficientB * (pricePerWatt * systemProduction.capacityKW) +
      solverRow.coefficientC * systemProduction.capacityKW +
      solverRow.coefficientD;

    const pkWh = annualPayment / (systemProduction.capacityKW * systemProduction.productivity);

    return {
      payment: annualPayment / 12,
      pkWh,
      solverRow,
      errors: !this.priceIsWithinBounds(pkWh, solverRow)
        ? ['Adjust the Turnkey system price to be within bounds.']
        : [],
    };
  }

  private priceIsWithinBounds(price: number, solverRow: V2EsaPricingSolverDocument): boolean {
    return price >= solverRow.minPricePerKwh && price <= solverRow.maxPricePerKwh;
  }

  calculateStorageOnly(
    solverRow: V2EsaPricingSolverDocument,
    devFee: number,
    storageRatePerKwh: number,
  ): V2EsaPricingCalculation {
    const annualPayment =
      solverRow.coefficientA * (devFee * storageRatePerKwh) +
      solverRow.coefficientB * storageRatePerKwh +
      solverRow.coefficientC;

    return {
      payment: annualPayment / 12,
      pkWh: null,
      solverRow,
      errors: [],
    };
  }

  async getQuoteById(id: string): Promise<LeanDocument<Quote>> {
    try {
      const res = await this.quoteService.getOneFullQuoteDataById(id);
      if (!res) throw Error('Unable find a quote with the given id.');
      return res;
    } catch (error) {
      throw ApplicationException.QuoteNotFound(error.message);
    }
  }

  async getSolverRowById(id: string): Promise<V2EsaPricingSolverDocument> {
    try {
      const res = await this.esaPricingSolverModel.findById(id);
      if (!res) throw Error('Unable find a solver row with the given id.');
      return res;
    } catch (error) {
      throw ApplicationException.EsaSolverRowNotFound(error.message);
    }
  }

  async getModeledDevFee(fundId: string): Promise<number> {
    try {
      // TODO: Implement this function.
      const { devFee } = await this.devFeeService.getDevFeeByCondition({ fundId });

      return devFee;
    } catch (error) {
      throw ApplicationException.UnprocessableEntity(error.message);
    }
  }
}
