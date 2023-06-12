import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PropertyService } from './property.service';
import { GetHomeownersByIdResDto } from './res/get-homeowners-by-id';

@ApiTags('Property')
@Controller('/property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Get('/homeowners')
  @ApiOperation({ summary: 'Get homeowners by Id' })
  @ApiOkResponse({ type: GetHomeownersByIdResDto })
  async getHomeownersById(@Query('propertyId') propertyId: string): Promise<GetHomeownersByIdResDto> {
    const result = await this.propertyService.getHomeownersById(propertyId);
    return ServiceResponse.fromResult(result);
  }
}
