import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { ProposalTemplateService } from './proposal-template.service';
import { CreateProposalTemplateDto } from './req/create-proposal-template.dto';
import { UpdateProposalTemplateDto } from './req/update-proposal-template.dto';
import { ProposalTemplateDto, ProposalTemplateListRes, ProposalTemplateRes } from './res/proposal-template.dto';

@ApiTags('Proposal Template')
@ApiBearerAuth()
@Controller('/proposal-templates')
@PreAuthenticate()
export class ProposalTemplateController {
  constructor(private readonly proposalTemplateService: ProposalTemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create Proposal Template' })
  @ApiOkResponse({ type: ProposalTemplateRes })
  async createProposalTemplate(
    @Body() proposalTemplateDto: CreateProposalTemplateDto,
  ): Promise<ServiceResponse<ProposalTemplateDto>> {
    const res = await this.proposalTemplateService.create(proposalTemplateDto);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update Proposal Template' })
  @ApiOkResponse({ type: ProposalTemplateRes })
  async updateProposalTemplate(
    @Param('id') id: string,
    @Body()
    proposalTemplateDto: UpdateProposalTemplateDto,
  ): Promise<ServiceResponse<ProposalTemplateDto>> {
    const res = await this.proposalTemplateService.update(id, proposalTemplateDto);
    return ServiceResponse.fromResult(res);
  }

  @Get()
  @ApiOperation({ summary: 'Get List' })
  @ApiQuery({ name: 'limit' })
  @ApiQuery({ name: 'skip' })
  @ApiQuery({ name: 'quoteId' })
  @ApiOkResponse({ type: ProposalTemplateListRes })
  async getList(
    @Query() query: { limit: string; skip: string; quoteId?: string },
  ): Promise<ServiceResponse<Pagination<ProposalTemplateDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const res = await this.proposalTemplateService.getList(limit, skip, query.quoteId);
    return ServiceResponse.fromResult(res);
  }
}
