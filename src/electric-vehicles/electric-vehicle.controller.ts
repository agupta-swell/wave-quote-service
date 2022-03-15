import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiBasicAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { ElectricVehicleService } from './electric-vehicle.service';
import { ElectricVehicleResDto, UniqueManufacturerNamesRes } from './res';

@ApiTags('Electric Vehicles')
@ApiBasicAuth()
@Controller('electric-vehicles')
@PreAuthenticate()
export class ElectricVehicleController {
  constructor(private readonly electricVehicleService: ElectricVehicleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all electric vehicles' })
  @ApiOkResponse({ type: [ElectricVehicleResDto] })
  async getAllElectricVehicles(): Promise<ServiceResponse<ElectricVehicleResDto[]>> {
    const res = await this.electricVehicleService.getAll();

    return ServiceResponse.fromResult(res);
  }

  @Get('unique-manufacturer-names')
  @ApiOperation({ summary: 'Get unique manufacturer names' })
  @ApiOkResponse({ type: UniqueManufacturerNamesRes })
  async getUniqueManufacturerNames(): Promise<ServiceResponse<UniqueManufacturerNamesRes>> {
    const res = await this.electricVehicleService.getUniqueManufacturerNames();

    return ServiceResponse.fromResult(res);
  }
}
