import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { LeanDocument } from 'mongoose';
import { RebateProgram } from 'src/rebate-programs/rebate-programs.schema';
import { RebateProgramService } from 'src/rebate-programs/rebate-programs.service';
import { IncentiveDetailsDto, QuoteFinanceProductDto, RebateDetailsDto, UpdateQuoteDto } from '../req';

@Injectable()
export class ValidateQuoteRebatesPipe implements PipeTransform<UpdateQuoteDto, Promise<UpdateQuoteDto>> {
  constructor(private readonly rebateProgramService: RebateProgramService) {}

  async transform(value: UpdateQuoteDto): Promise<UpdateQuoteDto> {
    if (!value.quoteFinanceProduct) {
      return value;
    }

    await this.validate(value.quoteFinanceProduct);

    return value;
  }

  private async validate(quoteFinanceProduct: QuoteFinanceProductDto): Promise<void> {
    const rebateTypes: string[] = [];

    const { rebateDetails, incentiveDetails } = quoteFinanceProduct;

    if (rebateDetails) {
      rebateTypes.push(...rebateDetails.map(e => e.type));
    }

    if (incentiveDetails) {
      rebateTypes.push(...incentiveDetails.map(e => e.type));
    }

    const foundRebates = await this.rebateProgramService.getManyByTypes(rebateTypes);

    rebateDetails.forEach(e => this.validateRabateType(foundRebates, e));

    incentiveDetails.forEach(e => this.validateIncentiveType(foundRebates, e));
  }

  private validateRabateType(rebates: LeanDocument<RebateProgram>[], rebateDetail: RebateDetailsDto): void {
    if (!rebates.find(e => e.name === rebateDetail.type)) {
      throw new NotFoundException(`Rebate type ${rebateDetail.type} invalid`);
    }
  }

  private validateIncentiveType(rebates: LeanDocument<RebateProgram>[], incentiveDetail: IncentiveDetailsDto): void {
    if (!rebates.find(e => e.name === incentiveDetail.type)) {
      throw new NotFoundException(`Incentive type ${incentiveDetail.type} invalid`);
    }
  }
}
