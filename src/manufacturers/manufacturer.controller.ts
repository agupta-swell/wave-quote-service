import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { ManufacturerService } from './manufacturer.service';
import { ManufacturerDto, ManufacturerPaginationRes } from './res/manufacturer.dto';

@ApiTags('Manufacturer')
@ApiBearerAuth()
@Controller('/manufacturers')
@PreAuthenticate()
export class ManufacturerController {
  constructor(private readonly manufacturerService: ManufacturerService) {}

  @Get()
  @ApiOperation({ summary: 'Get All Manufacturers' })
  @ApiQuery({ name: 'limit' })
  @ApiQuery({ name: 'skip' })
  @ApiOkResponse({ type: ManufacturerPaginationRes })
  async getManufacturers(
    @Query() query: { limit: string; skip: string },
  ): Promise<ServiceResponse<Pagination<ManufacturerDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const manufacturers = await this.manufacturerService.getList(limit, skip);

    return ServiceResponse.fromResult(manufacturers);
  }
}
