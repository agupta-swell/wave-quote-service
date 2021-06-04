import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { inRange } from 'lodash';
import { LeanDocument, Model, ObjectId, Types } from 'mongoose';
import { OperationResult, Pagination } from 'src/app/common';
import { FundingSource } from 'src/funding-sources/funding-source.schema';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { SystemDesign } from 'src/system-designs/system-design.schema';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { FinancialProduct, FINANCIAL_PRODUCT } from './financial-product.schema';
import { FinancialProductDto } from './res/financial-product.dto';

@Injectable()
export class FinancialProductsService {
  constructor(
    @InjectModel(FINANCIAL_PRODUCT) private financialProduct: Model<FinancialProduct>,
    private readonly systemDesignService: SystemDesignService,
    private readonly fundingSourceService: FundingSourceService,
  ) {}

  async getList(
    limit: number,
    skip: number,
    systemDesignId: ObjectId,
  ): Promise<OperationResult<Pagination<FinancialProductDto>>> {
    const [financialProducts, total] = await Promise.all([
      this.financialProduct.find().limit(limit).skip(skip).lean(),
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
          this.checkEligibleByQuoteType(financialProducts, fundingSources, { systemDesign }),
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
    });

    return res;
  }

  checkEligibleByQuoteType(
    financialProducts: LeanDocument<FinancialProduct>[],
    fundingSources: (FundingSource | null)[],
    data: any,
  ): LeanDocument<FinancialProduct>[] {
    return financialProducts.map(e => {
      const foundFundingSource = fundingSources.find(fs => fs?._id.toString() === e.fundingSourceId)?.toObject();
      if (foundFundingSource?.type === 'lease') {
        const systemDesign: LeanDocument<SystemDesign> = data.systemDesign;

        const systemKW = systemDesign.systemProductionData.capacityKW;
        const batteryKwh = systemDesign.roofTopDesignData.storage.reduce(
          (acc, cv) => (acc += cv.quantity * cv.storageModelDataSnapshot.sizekWh),
          0,
        );
        const systemProductivity = systemDesign.systemProductionData.productivity;

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
    });
  }
}
