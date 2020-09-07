import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { CreateSystemDesignDto, UpdateSystemDesignDto } from './req';
import { SystemDesignDto } from './res/system-design.dto';
import { SystemDesignService } from './system-design.service';

@ApiTags('System Design')
@Controller('/system-design')
export class SystemDesignController {
  constructor(private systemDesignService: SystemDesignService) {}

  @Post()
  @ApiOperation({ summary: 'Create system design' })
  @ApiOkResponse({ type: ServiceResponse })
  async create(@Body() systemDesign: CreateSystemDesignDto): Promise<ServiceResponse<SystemDesignDto>> {
    const result = await this.systemDesignService.create(systemDesign);
    return ServiceResponse.fromResult(result);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update system design' })
  @ApiOkResponse({ type: ServiceResponse })
  async update(
    @Param('id') id: string,
    @Body() systemDesign: UpdateSystemDesignDto,
  ): Promise<ServiceResponse<SystemDesignDto>> {
    const result = await this.systemDesignService.update(id, systemDesign);
    return ServiceResponse.fromResult(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete system design' })
  @ApiOkResponse({ type: ServiceResponse })
  async delete(@Param('id') id: string): Promise<ServiceResponse<string>> {
    const result = await this.systemDesignService.delete(id);
    return ServiceResponse.fromResult(result);
  }

  @Get()
  @ApiOperation({ summary: 'Get all system designs' })
  @ApiOkResponse({ type: Pagination })
  async getsystemDesigns(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
  ): Promise<ServiceResponse<Pagination<SystemDesignDto>>> {
    const result = await this.systemDesignService.getAllSystemDesigns(Number(limit), Number(skip));
    return ServiceResponse.fromResult(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detail' })
  @ApiOkResponse({ type: SystemDesignDto })
  async getDetails(@Param('id') id: string): Promise<ServiceResponse<SystemDesignDto>> {
    const result = await this.systemDesignService.getDetails(id);
    return ServiceResponse.fromResult(result);
  }
}
