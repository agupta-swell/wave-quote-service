import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { ProposalSectionMasterService } from './proposal-section-masters.service';
import { CreateProposalSectionMasterDto } from './req/create-proposal-section-master.dto';
import { UpdateProposalSectionMasterDto } from './req/update-proposal-section-master.dto';
import {
  ProposalSectionMasterDto,
  ProposalSectionMasterListRes,
  ProposalSectionMasterRes,
} from './res/proposal-section-master.dto';

@ApiTags('Proposal Section Master')
@Controller('/proposal-section-masters')
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
    @Param('id') id: string,
    @Body()
    proposalSectionMasterDto: UpdateProposalSectionMasterDto,
  ): Promise<ServiceResponse<ProposalSectionMasterDto>> {
    const res = await this.proposalSectionMasterService.update(id, proposalSectionMasterDto);
    return ServiceResponse.fromResult(res);
  }

  @Get()
  @ApiOperation({ summary: 'Get List' })
  @ApiQuery({ name: 'limit' })
  @ApiQuery({ name: 'skip' })
  @ApiOkResponse({ type: ProposalSectionMasterListRes })
  async getList(
    @Query() query: { limit: string; skip: string },
  ): Promise<ServiceResponse<Pagination<ProposalSectionMasterDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const res = await this.proposalSectionMasterService.getList(limit, skip);
    return ServiceResponse.fromResult(res);
  }
}
