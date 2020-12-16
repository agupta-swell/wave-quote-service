import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { ContractService } from './contract.service';
import { SaveContractReqDto } from './req';
import {
  GetContractTemplatesDto,
  GetContractTemplatesRes,
  GetCurrentContractDto,
  GetCurrentContractRes,
  SaveContractDto,
  SaveContractRes,
} from './res';

@ApiTags('Contract')
@ApiBearerAuth()
@Controller('/contracts')
@PreAuthenticate()
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Get('/current-contracts')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get Current Contracts' })
  @ApiOkResponse({ type: GetCurrentContractRes })
  @ApiQuery({ name: 'opportunity-id' })
  async getCurrentContracts(
    @Query('opportunity-id') opportunityId: string,
  ): Promise<ServiceResponse<GetCurrentContractDto>> {
    const res = await this.contractService.getCurrentContracts(opportunityId);
    return ServiceResponse.fromResult(res);
  }

  @Get('/contract-templates')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get Contract Templates' })
  @ApiOkResponse({ type: GetContractTemplatesRes })
  @ApiQuery({ name: 'opportunity-id' })
  async getContractTemplates(
    @Query('opportunity-id') opportunityId: string,
  ): Promise<ServiceResponse<GetContractTemplatesDto>> {
    const res = await this.contractService.getContractTemplates(opportunityId);
    return ServiceResponse.fromResult(res);
  }

  @Post()
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Save Contract' })
  @ApiOkResponse({ type: SaveContractRes })
  async saveContract(@Body() contractReq: SaveContractReqDto): Promise<ServiceResponse<SaveContractDto>> {
    const res = await this.contractService.saveContract(contractReq);
    return ServiceResponse.fromResult(res);
  }
}
