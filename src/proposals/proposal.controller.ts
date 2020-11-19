import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { CurrentUser } from '../app/securities';
import { CurrentUserType } from './../app/securities/current-user';
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
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'quote-id', required: false, example: 'quote-id' })
  @ApiQuery({ name: 'opportunity-id', required: false, example: 'opportunity-id' })
  @ApiOkResponse({ type: ProposalListRes })
  async getList(
    @Query() query: { limit: string; skip: string; 'quote-id': string; 'opportunity-id': string },
  ): Promise<ServiceResponse<Pagination<ProposalDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const res = await this.proposalService.getList(limit, skip, query['quote-id'], query['opportunity-id']);
    return ServiceResponse.fromResult(res);
  }

  // TODO: need to implement later -----> need to enable preauthenticate to take token in header
  // @PreAuthenticate()
  @Post('generate-link')
  async generateLinkByAgent(@Body() body: { proposalId: string }): Promise<ServiceResponse<{ proposalLink: string }>> {
    const res = await this.proposalService.generateLinkByAgent(body.proposalId);
    return ServiceResponse.fromResult(res);
  }

  @Get(':id')
  @ApiOkResponse({ type: ProposalRes })
  async getProposalById(@Param('id') id: string): Promise<ServiceResponse<ProposalDto>> {
    const res = await this.proposalService.getProposalDetails(id);
    return ServiceResponse.fromResult(res);
  }

  @Put(':proposalId/send-emails')
  @ApiOkResponse({ type: Boolean })
  async sendRecipients(
    @Param('proposalId') proposalId: string,
    @CurrentUser() user: CurrentUserType,
  ): Promise<ServiceResponse<Boolean>> {
    const res = await this.proposalService.sendRecipients(proposalId, user);
    return ServiceResponse.fromResult(res);
  }

  @Post('/validations')
  @ApiOkResponse({ type: ProposalRes })
  async getProposalLink(
    @Body() body: any,
  ): Promise<ServiceResponse<{ isAgent: boolean; proposalDetails: ProposalDto }>> {
    const res = await this.proposalService.verifyProposalToken(body.accessToken);
    return ServiceResponse.fromResult(res);
  }
}
