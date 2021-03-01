import {
  Body, Controller, Get, Param, Post, Put, Query,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { ProposalSectionMasterService } from './proposal-section-master.service';
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
  @ApiQuery({ name: 'products' })
  @ApiQuery({ name: 'financial-products' })
  @ApiOkResponse({ type: ProposalSectionMasterListRes })
  async getList(
    @Query() query: { limit: string; skip: string; products: string; 'financial-products': string },
  ): Promise<ServiceResponse<Pagination<ProposalSectionMasterDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const products = query.products?.split(',');
    const financialProducts = query['financial-products']?.split(',');
    const res = await this.proposalSectionMasterService.getList(limit, skip, products, financialProducts);
    return ServiceResponse.fromResult(res);
  }
}
