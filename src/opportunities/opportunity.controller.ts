import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { ContractResDto } from 'src/contracts/res/sub-dto';
import { ExistingSystemResDto } from 'src/existing-systems/res/existing-system.res.dto';
import { OpportunityService } from './opportunity.service';
import { GetOppExistingSystemsQuery } from './req/get-opp-existing-systems-query.dto';
import { UpdateOpportunityRebateProgramDto } from './req/update-opportunity-rebate-program.dto';
import { UpdateOpportunityTiltleNameMatchDto } from './req/update-opportunity-title-name-match.dto';
import { UpdateOpportunityUtilityProgramDto } from './req/update-opportunity-utility-program.dto';
import { GetFinancialSelectionsDto } from './res/financial-selection.dto';
import { GetRelatedInformationDto, GetRelatedInformationRes } from './res/get-related-information.dto';
import { QuoteDetailResDto } from './res/quote-detail.dto';

@ApiTags('Opportunity')
@ApiBearerAuth()
@Controller('/opportunities')
@PreAuthenticate()
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

  @Get(':opportunityId')
  @ApiOperation({ summary: 'Get Related Information For Opportunity' })
  @ApiOkResponse({ type: GetRelatedInformationRes })
  async getRelatedInformation(
    @Param('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<GetRelatedInformationDto>> {
    const result = await this.opportunityService.getRelatedInformation(opportunityId);
    return ServiceResponse.fromResult(result);
  }

  @Get('/:opportunityId/existing-systems')
  @ApiOperation({ summary: "Get All Opportunity's Existing Systems" })
  @ApiOkResponse({ type: GetRelatedInformationDto })
  async getAllOpportunityExistingSystems(
    @Param('opportunityId') opportunityId: string,
    @Query() query: GetOppExistingSystemsQuery,
  ): Promise<ServiceResponse<Pagination<ExistingSystemResDto>>> {
    const res = await this.opportunityService.getAllExistingSystems(opportunityId, query.limit, query.skip);

    return ServiceResponse.fromResult(res);
  }

  @Put('/:opportunityId/utility-program')
  @ApiOperation({ summary: "Update Opportunity's Utility Program" })
  @ApiOkResponse({ type: GetRelatedInformationDto })
  async updateOpportunityUtilityProgram(
    @Body() { utilityProgramId }: UpdateOpportunityUtilityProgramDto,
    @Param('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<GetRelatedInformationDto>> {
    const res = await this.opportunityService.updateOpportunityUtilityProgram(opportunityId, utilityProgramId);

    return ServiceResponse.fromResult(res);
  }

  @Put('/:opportunityId/rebate-program')
  @ApiOperation({ summary: "Update Opportunity's Rebate Program" })
  @ApiOkResponse({ type: GetRelatedInformationDto })
  async updateOpportunityRebateProgram(
    @Body() { rebateProgramId }: UpdateOpportunityRebateProgramDto,
    @Param('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<GetRelatedInformationDto>> {
    const res = await this.opportunityService.updateOpportunityRebateProgram(opportunityId, rebateProgramId);

    return ServiceResponse.fromResult(res);
  }

  @Put('/:opportunityId/title-name-match')
  @ApiOperation({ summary: "Update Opportunity's Title Name Match" })
  @ApiOkResponse({ type: GetRelatedInformationDto })
  async updateOpportunityTitleNameMatch(
    @Body() titleNameMatchData: UpdateOpportunityTiltleNameMatchDto,
    @Param('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<GetRelatedInformationDto>> {
    const res = await this.opportunityService.updateOpportunityTitleNameMatch(opportunityId, titleNameMatchData);
    return ServiceResponse.fromResult(res);
  }

  @Get('/:opportunityId/financial-selections')
  @ApiOperation({ summary: "Get opportunity's financial selections" })
  @ApiOkResponse({ type: GetFinancialSelectionsDto })
  async getFinancialSelections(
    @Param('opportunityId') oppId: string,
  ): Promise<ServiceResponse<GetFinancialSelectionsDto>> {
    const res = await this.opportunityService.getFinancialSelections(oppId);

    return ServiceResponse.fromResult(res);
  }

  @Get('/:opportunityId/contract')
  @ApiOperation({ summary: 'Get latest primary contract' })
  @ApiOkResponse({ type: ContractResDto })
  async getLatestPrimaryContract(@Param('opportunityId') oppId: string): Promise<ServiceResponse<ContractResDto>> {
    const res = await this.opportunityService.getLatestPrimaryContract(oppId);
    return ServiceResponse.fromResult(res);
  }

  @Get('/:opportunityId/quote-detail')
  @ApiOperation({ summary: 'Get quote detail of latest contract' })
  @ApiOkResponse({ type: QuoteDetailResDto })
  async getQuote(@Param('opportunityId') oppId: string): Promise<ServiceResponse<QuoteDetailResDto>> {
    const res = await this.opportunityService.getQuoteDetail(oppId);
    return ServiceResponse.fromResult(res);
  }
}
