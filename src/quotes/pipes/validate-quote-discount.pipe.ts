import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { LeanDocument } from 'mongoose';
import { DiscountService } from 'src/discounts/discount.service';
import { IDiscountDocument } from 'src/discounts/interfaces';
import { UpdateQuoteDto } from '../req';

@Injectable()
export class ValidateQuoteDiscountPipe implements PipeTransform<UpdateQuoteDto, Promise<UpdateQuoteDto>> {
  constructor(private readonly discountService: DiscountService) {}

  async transform(value: UpdateQuoteDto): Promise<UpdateQuoteDto> {
    if (!value.quoteFinanceProduct?.projectDiscountDetails || !value.quoteFinanceProduct.projectDiscountDetails.length) {
      return value as any;
    }

    const { projectDiscountDetails } = value.quoteFinanceProduct;

    const discounts = await this.validate(
      projectDiscountDetails.filter(e => e.id !== 'managerDiscount').map(e => e.id),
      value.id,
    );

    const newDiscounts = projectDiscountDetails.map(e => {
      const { id } = e;

      if (id === 'managerDiscount') {
        return {
          ...e,
          endDate: null,
          startDate: null,
          name: '',
        } as any;
      }

      const dbDiscount = discounts.find(f => f._id.toString() === id)!;

      const { _id, __v: _, ...p } = dbDiscount;

      return {
        id: _id.toString(),
        ...p,
      };
    });

    delete value.id;

    value.quoteFinanceProduct.projectDiscountDetails = newDiscounts;

    return value;
  }

  private async validate(discountIds: string[], quoteId?: string): Promise<LeanDocument<IDiscountDocument>[]> {
    const found = await this.discountService.getActiveDiscountAggregation({
      $match: {
        _id: { $in: discountIds },
      },
    });

    if (found.length !== discountIds.length) {
      discountIds.forEach(e => {
        if (!found.find(f => f._id.toString() === e)) {
          throw new NotFoundException(`Discount ${e} invalid`);
        }
      });
    }

    return found;
  }
}
