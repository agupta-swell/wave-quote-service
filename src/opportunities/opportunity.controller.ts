import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { OpportunityService } from './opportunity.service';
import { UpdateOpportunityDto } from './req/update-opportunity.dto';
import { GetRelatedInformationDto, GetRelatedInformationRes } from './res/get-related-information.dto';

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

  @Put('/:opportunityId')
  @ApiOperation({ summary: 'Update Opportunity' })
  @ApiOkResponse({ type: GetRelatedInformationDto })
  async updateOpportunity(
    @Body() data: UpdateOpportunityDto,
    @Param('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<GetRelatedInformationDto>> {
    const { opportunityId: _opportunityId, ...dataToSend } = data;

    const res = await this.opportunityService.updateOpportunity(opportunityId, dataToSend);

    return ServiceResponse.fromResult(res);
  }
}
