import { PipeTransform, Injectable } from '@nestjs/common';
import { ObjectId, Types } from 'mongoose';

@Injectable()
export class ParseGetAllPromotionsQueryPipe
  implements PipeTransform<Record<string, string>, Record<string, unknown>[]> {
  transform(value: Record<string, string>) {
    if (value.quoteId) {
      const quoteId = (new Types.ObjectId(value.quoteId) as unknown) as ObjectId;

      return ParseGetAllPromotionsQueryPipe.parseLookupQuoteValidation(quoteId);
    }

    return [];
  }

  public static parseLookupQuoteValidation(quoteId: ObjectId): Record<string, unknown>[] {
    return [
      {
        $lookup: {
          from: 'v2_quotes',
          let: {
            id: '$_id',
          },
          pipeline: [
            {
              $match: {
                _id: quoteId,
                'detailed_quote.quote_finance_product.promotion_details._id': {
                  $exists: true,
                },
                $expr: {
                  $in: ['$$id', '$detailed_quote.quote_finance_product.promotion_details._id'],
                },
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
          as: 'quotes',
        },
      },
      {
        $match: {
          'quotes.0': {
            $exists: false,
          },
        },
      },
      {
        $project: {
          quotes: 0,
        },
      },
    ];
  }
}
