import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Pagination, ServiceResponse } from "src/app/common";
import { PreAuthenticate } from "src/app/securities";
import { ManufacturerService } from "./manufacturer.service";
import { ManufacturerDto } from "./res/manufacturer.dto";

@ApiTags('Manufacturer')
@ApiBearerAuth()
@Controller('/manufacturers')
@PreAuthenticate()
export class ManufacturerController {
  constructor(private readonly manufacturerService: ManufacturerService) { }

  @Get()
  @ApiOperation({ summary: 'Update Geo Location' })
  async getManufacturers(
    @Query() query: { limit: string; skip: string },
  ): Promise<ServiceResponse<Pagination<ManufacturerDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const manufacturers = await this.manufacturerService.getList(limit, skip);

    return ServiceResponse.fromResult(manufacturers);
  }

}