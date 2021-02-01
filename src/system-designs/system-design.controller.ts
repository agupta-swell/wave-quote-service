import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { CheckOpportunity } from 'src/app/opportunity.pipe';
import { PreAuthenticate } from '../app/securities';
import { CreateSystemDesignDto, UpdateSystemDesignDto } from './req';
import { SystemDesignDto, SystemDesignListRes, SystemDesignRes } from './res/system-design.dto';
import { SystemDesignService } from './system-design.service';

@ApiTags('System Design')
@ApiBearerAuth()
@Controller('/system-designs')
@PreAuthenticate()
export class SystemDesignController {
  constructor(private systemDesignService: SystemDesignService) {}

  @Post()
  @ApiOperation({ summary: 'Create system design' })
  @ApiOkResponse({ type: SystemDesignRes })
  @CheckOpportunity()
  async create(@Body() systemDesign: CreateSystemDesignDto): Promise<ServiceResponse<SystemDesignDto>> {
    const result = await this.systemDesignService.create(systemDesign);
    return ServiceResponse.fromResult(result);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update system design' })
  @ApiOkResponse({ type: SystemDesignRes })
  @CheckOpportunity()
  async update(
    @Param('id') id: string,
    @Body() systemDesign: UpdateSystemDesignDto,
  ): Promise<ServiceResponse<SystemDesignDto>> {
    const result = await this.systemDesignService.update(id, systemDesign);
    return ServiceResponse.fromResult(result);
  }

  @Delete(':id/:opportunityId')
  @ApiOperation({ summary: 'Delete system design' })
  @ApiOkResponse({ type: ServiceResponse })
  async delete(
    @Param('id') id: string,
    @Param('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<string>> {
    const result = await this.systemDesignService.delete(id, opportunityId);
    return ServiceResponse.fromResult(result);
  }

  @Get()
  @ApiOperation({ summary: 'Get all system designs' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'selected' })
  @ApiQuery({ name: 'opportunityId' })
  @ApiOkResponse({ type: SystemDesignListRes })
  async getsystemDesigns(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('selected') selected: string,
    @Query('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<Pagination<SystemDesignDto>>> {
    const result = await this.systemDesignService.getAllSystemDesigns(
      Number(limit || 100),
      Number(skip || 0),
      selected,
      opportunityId,
    );
    return ServiceResponse.fromResult(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detail' })
  @ApiOkResponse({ type: SystemDesignRes })
  async getDetails(@Param('id') id: string): Promise<ServiceResponse<SystemDesignDto>> {
    const result = await this.systemDesignService.getDetails(id);
    return ServiceResponse.fromResult(result);
  }
}
