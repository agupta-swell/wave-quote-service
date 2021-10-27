import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { Pagination, ServiceResponse } from 'src/app/common';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { PreAuthenticate } from '../app/securities';
import { ProposalSectionMasterService } from './proposal-section-master.service';
import { GetAllProposalSectionsMasterQuery } from './req';
import { CreateProposalSectionMasterDto } from './req/create-proposal-section-master.dto';
import { UpdateProposalSectionMasterDto } from './req/update-proposal-section-master.dto';
import {
  ProposalSectionMasterDto,
  ProposalSectionMasterListRes,
  ProposalSectionMasterRes,
} from './res/proposal-section-master.dto';

@ApiTags('Proposal Section Master')
@ApiBearerAuth()
@Controller('/proposal-section-masters')
@PreAuthenticate()
export class ProposalSectionMasterController {
  constructor(private readonly proposalSectionMasterService: ProposalSectionMasterService) {}

  @Post()
  @ApiOperation({ summary: 'Create Proposal Section Master' })
  @ApiOkResponse({ type: ProposalSectionMasterRes })
  async createProposalSectionMaster(
    @Body() proposalSectionMasterDto: CreateProposalSectionMasterDto,
  ): Promise<ServiceResponse<ProposalSectionMasterDto>> {
    const res = await this.proposalSectionMasterService.create(proposalSectionMasterDto);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update Proposal Section Master' })
  @ApiOkResponse({ type: ProposalSectionMasterRes })
  async updateProposalSectionMaster(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
    @Body()
    proposalSectionMasterDto: UpdateProposalSectionMasterDto,
  ): Promise<ServiceResponse<ProposalSectionMasterDto>> {
    const res = await this.proposalSectionMasterService.update(id, proposalSectionMasterDto);
    return ServiceResponse.fromResult(res);
  }

  @Get()
  @ApiOperation({ summary: 'Get List' })
  @ApiQuery({ type: GetAllProposalSectionsMasterQuery })
  @ApiOkResponse({ type: ProposalSectionMasterListRes })
  async getList(
    @Query() query: GetAllProposalSectionsMasterQuery,
  ): Promise<ServiceResponse<Pagination<ProposalSectionMasterDto>>> {
    const res = await this.proposalSectionMasterService.getList(query);
    return ServiceResponse.fromResult(res);
  }
}
