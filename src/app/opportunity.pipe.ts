import { ArgumentMetadata, Injectable, PipeTransform, UsePipes } from '@nestjs/common';
import { ApplicationException } from 'src/app/app.exception';
import { OpportunityService } from './../opportunities/opportunity.service';

@Injectable()
export class OpportunityPipe implements PipeTransform {
  constructor(private readonly opportunityService: OpportunityService) {}
  async transform(value: any, metadata: ArgumentMetadata) {
    const { opportunityId } = value;
    const found = await this.opportunityService.isExistedOpportunity(opportunityId);

    if (!found) {
      throw ApplicationException.EnitityNotFound(`with opportunityId ${opportunityId} `);
    }

    return value;
  }
}

export const CheckOpportunity = () => UsePipes(OpportunityPipe);
