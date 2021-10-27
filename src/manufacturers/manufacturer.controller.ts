import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { ManufacturerService } from './manufacturer.service';
import { GetAllManufacturersQueryDto } from './req';
import { ManufacturerDto, ManufacturerPaginationRes } from './res/manufacturer.dto';

@ApiTags('Manufacturer')
@ApiBearerAuth()
@Controller('/manufacturers')
@PreAuthenticate()
export class ManufacturerController {
  constructor(private readonly manufacturerService: ManufacturerService) {}

  @Get()
  @ApiOperation({ summary: 'Get All Manufacturers' })
  @ApiQuery({ type: GetAllManufacturersQueryDto })
  @ApiOkResponse({ type: ManufacturerPaginationRes })
  async getManufacturers(
    @Query() query: GetAllManufacturersQueryDto,
  ): Promise<ServiceResponse<Pagination<ManufacturerDto>>> {
    const manufacturers = await this.manufacturerService.getList(query.limit, query.skip, query.by);

    return ServiceResponse.fromResult(manufacturers);
  }
}
