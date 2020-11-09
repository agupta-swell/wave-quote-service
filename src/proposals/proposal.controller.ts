import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { ProposalService } from './proposal.service';
import { CreateProposalDto } from './req/create-proposal.dto';
import { UpdateProposalDto } from './req/update-proposal.dto';
import { ProposalDto, ProposalListRes, ProposalRes } from './res/proposal.dto';

@ApiTags('Proposal')
@Controller('/proposals')
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  @ApiOperation({ summary: 'Create Proposal' })
  @ApiOkResponse({ type: ProposalRes })
  async createProposalSectionMaster(@Body() proposalDto: CreateProposalDto): Promise<ServiceResponse<ProposalDto>> {
    const res = await this.proposalService.create(proposalDto);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update Proposal' })
  @ApiOkResponse({ type: ProposalRes })
  async updateProposalSectionMaster(
    @Param('id') id: string,
    @Body()
    proposalDto: UpdateProposalDto,
  ): Promise<ServiceResponse<ProposalDto>> {
    const res = await this.proposalService.update(id, proposalDto);
    return ServiceResponse.fromResult(res);
  }

  @Get()
  @ApiOperation({ summary: 'Get List' })
  @ApiQuery({ name: 'limit' })
  @ApiQuery({ name: 'skip' })
  @ApiOkResponse({ type: ProposalListRes })
  async getList(@Query() query: { limit: string; skip: string }): Promise<ServiceResponse<Pagination<ProposalDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const res = await this.proposalService.getList(limit, skip);
    return ServiceResponse.fromResult(res);
  }
}
