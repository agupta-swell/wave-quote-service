import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { BigNumber } from 'bignumber.js';
import { OperationResult, Pagination } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { TAX_CREDIT_CONFIG_COLLECTION } from './tax-credit-config.constant';
import { TaxCreditConfigResDto } from './dto';
import { ITaxCreditConfigDocument, ITaxCreditConfig, ITaxCreditConfigSnapshot } from './interfaces';

@Injectable()
export class TaxCreditConfigService {
  constructor(
    @InjectModel(TAX_CREDIT_CONFIG_COLLECTION)
    private taxCreditConfigModel: Model<ITaxCreditConfigDocument>,
  ) {}

  public static parseActiveTaxCreditConfigValidation(): { $match: Record<string, unknown> } {
    const now = new Date();

    return {
      $match: {
        end_date: {
          $gte: now,
        },
        start_date: {
          $lte: now,
        },
      },
    };
  }

  public async getActiveTaxCreditConfigs(): Promise<LeanDocument<ITaxCreditConfigDocument>[]> {
    const res = await this.taxCreditConfigModel
      .find(TaxCreditConfigService.parseActiveTaxCreditConfigValidation().$match)
      .lean();

    return res;
  }

  public static validate(taxCreditConfig: ITaxCreditConfig): boolean {
    const now = new Date();

    const { startDate, endDate } = taxCreditConfig;

    return startDate <= now && now <= endDate;
  }

  public async getAllTaxCredits(): Promise<OperationResult<Pagination<TaxCreditConfigResDto>>> {
    const [taxCredits, total] = await Promise.all([
      this.taxCreditConfigModel.find().lean(),
      this.taxCreditConfigModel.estimatedDocumentCount().lean(),
    ]);
    const data = strictPlainToClass(TaxCreditConfigResDto, taxCredits);
    const result = {
      data,
      total,
    };
    return OperationResult.ok(new Pagination(result));
  }

  public static snapshot(
    taxCreditConfig: ITaxCreditConfigDocument | LeanDocument<ITaxCreditConfigDocument>,
    totalGrandValue: number,
  ): ITaxCreditConfigSnapshot {
    const now = new Date();
    const { _id = '', ...p } = taxCreditConfig;
    return {
      name: taxCreditConfig.name,
      percentage: taxCreditConfig.percentage,
      value: new BigNumber(totalGrandValue).multipliedBy(taxCreditConfig.percentage).dividedBy(100).toNumber(),
      taxCreditConfigDataId: _id.toString(),
      taxCreditConfigDataSnapshot: p,
      taxCreditConfigDataSnapshotDate: now,
    };
  }
}
