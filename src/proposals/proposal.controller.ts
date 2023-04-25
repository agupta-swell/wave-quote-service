import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { ObjectId } from 'mongoose';
import { Pagination, ServiceResponse } from 'src/app/common';
import { CheckOpportunity } from 'src/app/opportunity.pipe';
import { CatchDocusignException } from 'src/docusign-communications/filters';
import { UseDocusignContext } from 'src/shared/docusign';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { CurrentUser, CustomJWTSecretKey, PreAuthenticate } from '../app/securities';
import { ILoggedInUser } from '../app/securities/current-user';
import { ProposalService } from './proposal.service';
import { CreateProposalDto, SaveProposalAnalyticDto, UpdateProposalDto, ValidateProposalDto } from './req';
import { CreateProposalLinkDto } from './req/create-proposal-link.dto';
import { GetPresignedUrlSqtDto } from './req/get-presigned-url-sqt.dto';
import { GetPresignedUrlDto } from './req/get-presigned-url.dto';
import { ProposalSendSampleContractDto } from './req/send-sample-contract.dto';
import { ProposalAnalyticDto } from './res/proposal-analytic.dto';
import { ProposalDto, ProposalListRes, ProposalRes } from './res/proposal.dto';
import { PROPOSAL_FILTER_STATUS } from './constants';

@ApiTags('Proposal')
@Controller('/proposals')
@CatchDocusignException()
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Create Proposal' })
  @ApiOkResponse({ type: ProposalRes })
  @CheckOpportunity()
  async createProposalSectionMaster(@Body() proposalDto: CreateProposalDto): Promise<ServiceResponse<ProposalDto>> {
    const res = await this.proposalService.create(proposalDto);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:id')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Update Proposal' })
  @ApiOkResponse({ type: ProposalRes })
  @CheckOpportunity()
  async updateProposal(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
    @Body()
    proposalDto: UpdateProposalDto,
  ): Promise<ServiceResponse<ProposalDto>> {
    const res = await this.proposalService.update(id, proposalDto);
    return ServiceResponse.fromResult(res);
  }

  @Get()
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get List' })
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'quote-id', required: false, example: 'quote-id' })
  @ApiQuery({ name: 'opportunity-id', required: false, example: 'opportunity-id' })
  @ApiQuery({ name: 'status', required: false })
  @ApiOkResponse({ type: ProposalListRes })
  async getList(
    @Query()
    query: {
      limit: string;
      skip: string;
      'quote-id': string;
      'opportunity-id': string;
      status: PROPOSAL_FILTER_STATUS;
    },
  ): Promise<ServiceResponse<Pagination<ProposalDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const res = await this.proposalService.getList(
      limit,
      skip,
      query['quote-id'],
      query['opportunity-id'],
      query.status || PROPOSAL_FILTER_STATUS.ACTIVE,
    );
    return ServiceResponse.fromResult(res);
  }

  @Post('generate-link')
  @PreAuthenticate()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Link To Access Proposal Page' })
  async generateLinkByAgent(
    @Body() body: CreateProposalLinkDto,
    @CurrentUser() user: ILoggedInUser,
  ): Promise<ServiceResponse<{ proposalLink: string }>> {
    const res = await this.proposalService.generateLinkByAgent(body.proposalId, user);
    return ServiceResponse.fromResult(res);
  }

  @Get(':id')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get Detail' })
  @ApiOkResponse({ type: ProposalRes })
  async getProposalById(@Param('id', ParseObjectIdPipe) id: ObjectId): Promise<ServiceResponse<ProposalDto>> {
    const res = await this.proposalService.getProposalDetails(id);
    return ServiceResponse.fromResult(res);
  }

  @Put(':proposalId/send-emails')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Send Emails' })
  @ApiOkResponse({ type: Boolean })
  async sendRecipients(
    @Param('proposalId', ParseObjectIdPipe) proposalId: ObjectId,
    @Body() additionalRecipients: string[],
    @CurrentUser() user: ILoggedInUser,
  ): Promise<ServiceResponse<ProposalDto>> {
    const res = await this.proposalService.sendRecipients(proposalId, additionalRecipients);
    return ServiceResponse.fromResult(res);
  }

  @Post('/validations')
  @ApiOperation({ summary: 'Validate and Response Data' })
  @ApiOkResponse({ type: ProposalRes })
  @CustomJWTSecretKey(process.env.PROPOSAL_JWT_SECRET || '')
  async getProposalLink(
    @Body() body: ValidateProposalDto,
  ): Promise<ServiceResponse<{ isAgent: boolean; proposalDetail: ProposalDto }>> {
    const res = await this.proposalService.verifyProposalToken(body);
    return ServiceResponse.fromResult(res);
  }

  @Get('/get-proposal-analytic/:proposalId')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get Proposal Analytic by proposalId' })
  @ApiOkResponse({ type: ProposalAnalyticDto })
  async getProposalAnalytic(
    @Param('proposalId', ParseObjectIdPipe) proposalId: ObjectId,
  ): Promise<ServiceResponse<boolean>> {
    const res = await this.proposalService.getProposalAnalyticByProposalId(proposalId);
    return ServiceResponse.fromResult(res);
  }

  @Post('/save-analytics')
  @ApiOperation({ summary: 'Validate and Save Analytic Information' })
  @ApiOkResponse({ type: Boolean })
  @CustomJWTSecretKey(process.env.PROPOSAL_JWT_SECRET || '')
  async saveProposalAnalytic(@Body() body: SaveProposalAnalyticDto): Promise<ServiceResponse<boolean>> {
    const res = await this.proposalService.saveProposalAnalytic(body);
    return ServiceResponse.fromResult(res);
  }

  @Post('/get-presigned-url')
  @ApiOperation({ summary: 'Validate and Response Url' })
  @ApiOkResponse({ type: String })
  @CustomJWTSecretKey(process.env.PROPOSAL_JWT_SECRET || '')
  async getPresignedUrlProposalApp(@Body() body: GetPresignedUrlDto): Promise<ServiceResponse<string>> {
    const res = await this.proposalService.getPreSignedObjectUrl(
      body.fileName,
      body.fileType,
      body.token,
      false,
      body.isDownload,
      body.isProposal,
    );
    return ServiceResponse.fromResult(res);
  }

  @Post('/get-presigned-url-sqt')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Validate and Response Url' })
  @ApiOkResponse({ type: String })
  async getPresignedUrl(@Body() body: GetPresignedUrlSqtDto): Promise<ServiceResponse<string>> {
    const res = await this.proposalService.getPreSignedObjectUrl(
      body.fileName,
      body.fileType,
      '',
      true,
      false,
      body.isProposal,
    );
    return ServiceResponse.fromResult(res);
  }

  @Post(':proposalId/sample-contracts')
  @UseDocusignContext()
  @PreAuthenticate()
  @ApiBearerAuth()
  @ApiParam({ name: 'proposalId', type: String })
  @ApiOperation({ summary: 'Send sample contract' })
  @ApiOkResponse({ type: ProposalRes })
  async sendSampleContracts(
    @Param('proposalId', ParseObjectIdPipe) proposalId: ObjectId,
    @Body() body: ProposalSendSampleContractDto,
  ) {
    const { templateDetails, signerDetails } = plainToClass(ProposalSendSampleContractDto, body);

    const res = await this.proposalService.sendSampleContract(proposalId, templateDetails, signerDetails);
    return ServiceResponse.fromResult(res);
  }

  @Delete('/:proposalId')
  @ApiOperation({ summary: 'Delete quote' })
  async deleteQuote(@Param('proposalId', ParseObjectIdPipe) proposalId: ObjectId): Promise<void> {
    await this.proposalService.deleteProposal(proposalId);
  }
}
