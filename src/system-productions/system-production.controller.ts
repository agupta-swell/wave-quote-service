import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { ServiceResponse } from '../app/common';
import { PreAuthenticate } from '../app/securities';
import { CreateSystemProductionDto, UpdateSystemProductionDto } from './req';
import { SystemProductionDto } from './res';
import { SystemProductionService } from './system-production.service';

@ApiTags('System Production')
@ApiBearerAuth()
@Controller('/system-production')
@PreAuthenticate()
export class SystemProductionController {
  constructor(private readonly systemProductionService: SystemProductionService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get system production detail by Id' })
  async get(@Param('id', ParseObjectIdPipe) id: ObjectId): Promise<ServiceResponse<SystemProductionDto>> {
    const result = await this.systemProductionService.findById(id);
    return ServiceResponse.fromResult(result);
  }

  @Post()
  @ApiOperation({ summary: 'Create system production' })
  async create(@Body() data: CreateSystemProductionDto): Promise<ServiceResponse<SystemProductionDto>> {
    const result = await this.systemProductionService.create(data);
    return ServiceResponse.fromResult(result);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update system production' })
  async update(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
    @Body() data: UpdateSystemProductionDto,
  ): Promise<ServiceResponse<SystemProductionDto>> {
    const result = await this.systemProductionService.update(id, data);
    return ServiceResponse.fromResult(result);
  }
}
