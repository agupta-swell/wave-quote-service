import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { Pagination, ServiceResponse } from 'src/app/common';
import { CheckOpportunity } from 'src/app/opportunity.pipe';
import { PreAuthenticate } from 'src/app/securities';
import { UseAsyncContext } from 'src/shared/async-context/decorators';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import {
  CalculateSunroofOrientationDto,
  CreateSystemDesignDto,
  GetBoundingBoxesReqDto,
  GetHeatmapSignedUrlsQueryDto,
  UpdateAncillaryMasterDtoReq,
  UpdateSystemDesignDto,
} from './req';
import {
  AnciallaryMasterRes,
  CalculateSunroofOrientationResDto,
  GetBoundingBoxesResDto,
  GetHeatmapSignedUrlsResDto,
  SystemDesignAncillaryMasterDto,
  SystemDesignAncillaryMasterListRes,
  SystemDesignDto,
  SystemDesignListRes,
  SystemDesignRes,
} from './res';
import { SystemDesignService } from './system-design.service';

@ApiTags('System Design')
@ApiBearerAuth()
@Controller('/system-designs')
@PreAuthenticate()
export class SystemDesignController {
  constructor(private systemDesignService: SystemDesignService) {}

  @UseAsyncContext
  @Post('/')
  @ApiOperation({ summary: 'Create system design' })
  @ApiOkResponse({ type: SystemDesignRes })
  @CheckOpportunity()
  async create(@Body() systemDesign: CreateSystemDesignDto): Promise<ServiceResponse<SystemDesignDto>> {
    const result = await this.systemDesignService.create(systemDesign);
    return ServiceResponse.fromResult(result);
  }

  @UseAsyncContext
  @Put(':id')
  @ApiOperation({ summary: 'Update system design' })
  @ApiOkResponse({ type: SystemDesignRes })
  @CheckOpportunity()
  async update(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
    @Body() systemDesign: UpdateSystemDesignDto,
  ): Promise<ServiceResponse<SystemDesignDto>> {
    const result = await this.systemDesignService.update(id, systemDesign);
    return ServiceResponse.fromResult(result);
  }

  @UseAsyncContext
  @Post(':id/calculate')
  @ApiParam({ name: 'id', type: String, description: 'use -1 for uncreated system design' })
  @ApiOperation({ summary: 'Recalculate system design' })
  @ApiOkResponse({ type: SystemDesignRes })
  async recalculate(
    @Param('id', ParseObjectIdPipe) id: ObjectId | null,
    @Body() systemDesign: UpdateSystemDesignDto,
  ): Promise<ServiceResponse<SystemDesignDto>> {
    const result = await this.systemDesignService.recalculateSystemDesign(id, systemDesign);
    return ServiceResponse.fromResult(result);
  }

  @Delete(':id/:opportunityId')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Delete system design' })
  @ApiOkResponse({ type: ServiceResponse })
  async delete(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
    @Param('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<string>> {
    const result = await this.systemDesignService.delete(id, opportunityId);
    return ServiceResponse.fromResult(result);
  }

  @Get()
  @ApiOperation({ summary: 'Get all system designs' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'opportunityId' })
  @ApiOkResponse({ type: SystemDesignListRes })
  async getsystemDesigns(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<Pagination<SystemDesignDto>>> {
    const result = await this.systemDesignService.getAllSystemDesigns(
      Number(limit || 100),
      Number(skip || 0),
      opportunityId,
    );
    return ServiceResponse.fromResult(result);
  }

  @Get('/ancillaries-master')
  @ApiOperation({ summary: 'Get all ancillaries master' })
  @ApiOkResponse({ type: SystemDesignAncillaryMasterListRes })
  async getAncillaryList(): Promise<ServiceResponse<Pagination<SystemDesignAncillaryMasterDto>>> {
    const result = await this.systemDesignService.getAncillaryList();
    return ServiceResponse.fromResult(result);
  }

  @Put('/ancillaries-master/:ancillaryId')
  @ApiOperation({ summary: 'Update ancillaries master' })
  @ApiOkResponse({ type: AnciallaryMasterRes })
  async updateAncillary(
    @Param('ancillaryId', ParseObjectIdPipe) ancillaryId: ObjectId,
    @Body() req: UpdateAncillaryMasterDtoReq,
  ): Promise<ServiceResponse<SystemDesignAncillaryMasterDto>> {
    const result = await this.systemDesignService.updateAncillaryMaster(ancillaryId, req);
    return ServiceResponse.fromResult(result);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Get detail' })
  @ApiOkResponse({ type: SystemDesignRes })
  async getDetails(@Param('id', ParseObjectIdPipe) id: ObjectId): Promise<ServiceResponse<SystemDesignDto>> {
    const result = await this.systemDesignService.getDetails(id);
    return ServiceResponse.fromResult(result);
  }

  // TODO change path to `/calculate-sunroof-orientation` ??
  @Post('/calculate-sunroof')
  async calculateSunroofOrientation(
    @Body() req: CalculateSunroofOrientationDto,
  ): Promise<ServiceResponse<CalculateSunroofOrientationResDto>> {
    const result = await this.systemDesignService.calculateSunroofOrientation(req);
    return ServiceResponse.fromResult(result);
  }

  @Get('/bounding-boxes')
  async getBoundingBoxes(@Query() req: GetBoundingBoxesReqDto): Promise<ServiceResponse<GetBoundingBoxesResDto>> {
    const result = await this.systemDesignService.getSunroofBoundingBoxes(req);
    return ServiceResponse.fromResult(result);
  }

  @Get(':id/heatmap-pngs')
  @ApiParam({ name: 'id', type: String })
  async generateHeatmapPngs(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
    @Query() query: GetHeatmapSignedUrlsQueryDto,
  ): Promise<ServiceResponse<GetHeatmapSignedUrlsResDto>> {
    const result = await this.systemDesignService.getHeatmapSignedUrls(id, query);
    return ServiceResponse.fromResult(result);
  }

  @Get(':id/array-overlay-png')
  @ApiParam({ name: 'id', type: String })
  async generateArrayOverlayPng(@Param('id', ParseObjectIdPipe) id: ObjectId): Promise<ServiceResponse> {
    const result = await this.systemDesignService.getArrayOverlayPng(id);
    return ServiceResponse.fromResult(result);
  }

  // TODO I don't know if this is the final location for this or perhaps
  //      it will be handled from the recalculate() function in this file.
  @Post(':id/calculate-sunroof-production')
  @ApiParam({ name: 'id', type: String })
  async calculateSunroofProduction(@Param('id', ParseObjectIdPipe) id: ObjectId): Promise<ServiceResponse> {
    const result = await this.systemDesignService.calculateSunroofProduction(id);
    return ServiceResponse.fromResult(result);
  }
}
