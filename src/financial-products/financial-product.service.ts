import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { inRange } from 'lodash';
import { LeanDocument, Model, ObjectId, Types } from 'mongoose';
import { OperationResult, Pagination } from 'src/app/common';
import { FundingSource } from 'src/funding-sources/funding-source.schema';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { FINANCE_PRODUCT_TYPE } from 'src/quotes/constants';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { SystemDesign } from 'src/system-designs/system-design.schema';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { SystemProductionService } from 'src/system-productions/system-production.service';
import { FinancialProduct, FINANCIAL_PRODUCT } from './financial-product.schema';
import { FinancialProductDto } from './res/financial-product.dto';

@Injectable()
export class FinancialProductsService {
  constructor(
    @InjectModel(FINANCIAL_PRODUCT) private financialProduct: Model<FinancialProduct>,
    private readonly systemDesignService: SystemDesignService,
    private readonly fundingSourceService: FundingSourceService,
    private readonly systemProductionService: SystemProductionService,
  ) {}

  async getList(
    limit: number,
    skip: number,
    systemDesignId: ObjectId,
  ): Promise<OperationResult<Pagination<FinancialProductDto>>> {
    const [financialProducts, total] = await Promise.all([
      this.financialProduct.find({ isActive: true }).limit(limit).skip(skip).lean(),
      this.financialProduct.countDocuments().lean(),
    ]);

    const fundingSources = await Promise.all(
      financialProducts.map(e => this.fundingSourceService.getDetailById(e.fundingSourceId)),
    );

    let systemDesign: LeanDocument<SystemDesign> | null = null;
    if (systemDesignId) {
      systemDesign = await this.systemDesignService.getOneById(systemDesignId);
    }
    return OperationResult.ok(
      new Pagination({
        data: strictPlainToClass(
          FinancialProductDto,
          await this.checkEligibleByQuoteType(financialProducts, fundingSources, { systemDesign }),
        ),
        total,
      }),
    );
  }

  async getDetailByFinancialProductId(id: string): Promise<LeanDocument<FinancialProduct> | null> {
    const detail = await this.financialProduct.findOne({ _id: { $eq: Types.ObjectId(id) } }).lean();
    return detail;
  }

  async getAllFinancialProductsByIds(ids: string[]): Promise<LeanDocument<FinancialProduct>[] | null> {
    const res = await this.financialProduct.find({
      _id: {
        $in: ids.map(Types.ObjectId),
      },
      isActive: true,
    });

    return res;
  }

  checkEligibleByQuoteType(
    financialProducts: LeanDocument<FinancialProduct>[],
    fundingSources: (FundingSource | null)[],
    data: any,
  ): Promise<LeanDocument<FinancialProduct>[]> {
    return Promise.all(
      financialProducts.map(async e => {
        const foundFundingSource = fundingSources.find(fs => fs?._id.toString() === e.fundingSourceId)!;
        if (foundFundingSource?.type === 'lease') {
          const systemDesign: LeanDocument<SystemDesign> = data.systemDesign;

          const systemProductionData = await this.systemProductionService.findById(systemDesign.systemProductionId);

          let systemKW = 0;
          let batteryKwh = 0;
          let systemProductivity = 0;
          if (systemProductionData.data) {
            systemKW = systemProductionData.data.capacityKW;
            batteryKwh = systemDesign.roofTopDesignData.storage.reduce(
              (acc, cv) => (acc += cv.quantity * cv.storageModelDataSnapshot.ratings.kilowattHours),
              0,
            );
            systemProductivity = systemProductionData.data.productivity;
          }

          if (
            !inRange(systemKW, e.minSystemKw, e.maxSystemKw) ||
            !inRange(batteryKwh, e.minBatteryKwh, e.maxBatteryKwh) ||
            !inRange(systemProductivity, e.minProductivity, e.maxProductivity)
          ) {
            e.name = `${e.name} (not eligible)`;
          }

          return e;
        }
        return e;
      }),
    );
  }

  async getLowestDealerFee(fundingSourceType: FINANCE_PRODUCT_TYPE): Promise<number> {
    const fundingSources = await this.fundingSourceService.getAll({ type: fundingSourceType });
    const financialProducts = await this.financialProduct
      .find({
        fundingSourceId: { $in: fundingSources.map(fs => fs._id) },
        isActive: true,
      })
      .sort({
        dealer_fee: 1,
      })
      .lean();

    return financialProducts[0].dealerFee;
  }
}
