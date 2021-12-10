import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { LeanDocument } from 'mongoose';
import { PromotionService } from 'src/promotions/promotion.service';
import { IPromotionDocument } from 'src/promotions/interfaces';
import { UpdateQuoteDto } from '../req';

@Injectable()
export class ValidateQuotePromotionsPipe implements PipeTransform<UpdateQuoteDto, Promise<UpdateQuoteDto>> {
  constructor(private readonly promotionService: PromotionService) {}

  async transform(value: UpdateQuoteDto): Promise<UpdateQuoteDto> {
    if (!value.quoteFinanceProduct?.promotionDetails || !value.quoteFinanceProduct.promotionDetails.length) {
      return value as any;
    }

    const { promotionDetails } = value.quoteFinanceProduct;

    const promotions = await this.validate(
      promotionDetails.map(e => e.id),
      value.id,
    );

    const newPromotions = promotionDetails.map(e => {
      const { id } = e;

      const dbPromotion = promotions.find(f => f._id.toString() === id)!;

      const { _id, __v: _, ...p } = dbPromotion;

      return {
        id: _id.toString(),
        ...p,
      };
    });

    delete value.id;

    value.quoteFinanceProduct.promotionDetails = newPromotions;

    return value;
  }

  private async validate(promotionIds: string[], quoteId?: string): Promise<LeanDocument<IPromotionDocument>[]> {
    const found = await this.promotionService.getActivePromotionsAggregation({
      $match: {
        _id: { $in: promotionIds },
      },
    });

    if (found.length !== promotionIds.length) {
      promotionIds.forEach(e => {
        if (!found.find(f => f._id.toString() === e)) {
          throw new NotFoundException(`Promotion ${e} invalid`);
        }
      });
    }

    return found;
  }
}
