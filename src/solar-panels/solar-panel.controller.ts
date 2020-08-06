import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { CreateSolarPanelDto } from './req/create-solar-panel.dto';
import { UpdateSolarPanelDto } from './req/update-solar-panel.dto';
import { SolarPanelDto } from './res/solar-panel.dto';
import { SolarPanelService } from './solar-panel.service';

@ApiTags('Solar Panel')
@Controller('/solar-panels')
export class SolarPanelController {
  constructor(private solarPanelService: SolarPanelService) {}

  @Post()
  @ApiOperation({ summary: 'Create solar panel' })
  async create(@Body() solarPanel: CreateSolarPanelDto): Promise<ServiceResponse<{ id: string }>> {
    const result = await this.solarPanelService.create(solarPanel);
    return ServiceResponse.fromResult(result);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update solar panel' })
  async update(
    @Param('id') id: string,
    @Body() solarPanel: UpdateSolarPanelDto,
  ): Promise<ServiceResponse<{ id: string }>> {
    const result = await this.solarPanelService.update(id, solarPanel);
    return ServiceResponse.fromResult(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete solar panel' })
  async delete(@Param('id') id: string): Promise<ServiceResponse<string>> {
    const result = await this.solarPanelService.delete(id);
    return ServiceResponse.fromResult(result);
  }

  @Get()
  @ApiOperation({ summary: 'Get all solar panels' })
  @ApiOkResponse({ type: SolarPanelDto, isArray: true })
  async getSolarPanels(): Promise<ServiceResponse<Pagination<SolarPanelDto>>> {
    const result = await this.solarPanelService.getAllSolarPanels();
    return ServiceResponse.fromResult(result);
  }
}
