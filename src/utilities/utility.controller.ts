import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { UtilityDto } from './res/utility.dto';
import { UtilityService } from './utility.service';

@ApiTags('Utilities')
@Controller('/utilities')
export class UtilityController {
  constructor(private readonly utilityService: UtilityService) {}

  @Get()
  async getDetails(@Query('zipCode') zipCode: string): Promise<ServiceResponse<UtilityDto>> {
    const res = await this.utilityService.getUtilityDetails(Number(zipCode));
    return ServiceResponse.fromResult(res);
  }
}
