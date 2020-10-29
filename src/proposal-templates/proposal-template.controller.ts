import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { ProposalTemplateService } from './proposal-template.service';
import { CreateProposalTemplateDto } from './req/create-proposal-template.dto';
import { UpdateProposalTemplateDto } from './req/update-proposal-template.dto';
import { ProposalTemplateDto, ProposalTemplateListRes, ProposalTemplateRes } from './res/proposal-template.dto';

@ApiTags('Proposal Template')
@Controller('/proposal-templates')
export class ProposalTemplateController {
  constructor(private readonly proposalSectionMasterService: ProposalTemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create Proposal Template' })
  @ApiOkResponse({ type: ProposalTemplateRes })
  async createProposalSectionMaster(
    @Body() proposalSectionMasterDto: CreateProposalTemplateDto,
  ): Promise<ServiceResponse<ProposalTemplateDto>> {
    const res = await this.proposalSectionMasterService.create(proposalSectionMasterDto);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update Proposal Template' })
  @ApiOkResponse({ type: ProposalTemplateRes })
  async updateProposalSectionMaster(
    @Param('id') id: string,
    @Body()
    proposalSectionMasterDto: UpdateProposalTemplateDto,
  ): Promise<ServiceResponse<ProposalTemplateDto>> {
    const res = await this.proposalSectionMasterService.update(id, proposalSectionMasterDto);
    return ServiceResponse.fromResult(res);
  }

  @Get()
  @ApiOperation({ summary: 'Get List' })
  @ApiQuery({ name: 'limit' })
  @ApiQuery({ name: 'skip' })
  @ApiOkResponse({ type: ProposalTemplateListRes })
  async getList(
    @Query() query: { limit: string; skip: string },
  ): Promise<ServiceResponse<Pagination<ProposalTemplateDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const res = await this.proposalSectionMasterService.getList(limit, skip);
    return ServiceResponse.fromResult(res);
  }
}
