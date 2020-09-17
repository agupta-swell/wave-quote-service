import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { TariffDto, UtilityDto } from './res';
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

  @Get('/typical-baselines')
  async getTypicalBaseline(@Query('zipCode') zipCode: string): Promise<ServiceResponse<UtilityDto>> {
    const res = await this.utilityService.getTypicalBaseline(Number(zipCode));
    return ServiceResponse.fromResult(res);
  }

  @Get('/tariffs')
  async getTariff(@Query() query: { zipCode: string; lseId: string }): Promise<ServiceResponse<TariffDto>> {
    const res = await this.utilityService.getTariff(Number(query.zipCode), Number(query.lseId || 734));
    return ServiceResponse.fromResult(res);
  }

  @Get('/costs')
  async calculateCost(
    @Query() query: { zipCode: string; masterTariffId: string },
  ): Promise<ServiceResponse<any>> {
    const res = await this.utilityService.calculateCost([], query.masterTariffId || '522');
    return ServiceResponse.fromResult(res);
  }
}
