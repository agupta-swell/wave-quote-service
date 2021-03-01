import {
  Body, Controller, Get, Param, Post, Query,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { ContractService } from './contract.service';
import { SaveChangeOrderReqDto, SaveContractReqDto } from './req';
import {
  GetContractTemplatesDto,
  GetContractTemplatesRes,
  GetCurrentContractDto,
  GetCurrentContractRes,
  GetDocusignCommunicationDetailsDto,
  GetDocusignCommunicationDetailsRes,
  SaveChangeOrderDto,
  SaveChangeOrderRes,
  SaveContractDto,
  SaveContractRes,
  SendContractDto,
  SendContractRes,
} from './res';

@ApiTags('Contract')
@ApiBearerAuth()
@Controller('/contracts')
@PreAuthenticate()
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Get('/current-contracts')
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
  @ApiOperation({ summary: 'Get Contract Templates' })
  @ApiOkResponse({ type: GetContractTemplatesRes })
  @ApiQuery({ name: 'opportunity-id' })
  @ApiQuery({ name: 'funding-source-id' })
  async getContractTemplates(
    @Query('opportunity-id') opportunityId: string,
    @Query('funding-source-id') fundingSourceId: string,
  ): Promise<ServiceResponse<GetContractTemplatesDto>> {
    const res = await this.contractService.getContractTemplates(opportunityId, fundingSourceId);
    return ServiceResponse.fromResult(res);
  }

  @Get('/:contractId/docusign-communications')
  @ApiOperation({ summary: 'Get Docusign Communication Details' })
  @ApiOkResponse({ type: GetDocusignCommunicationDetailsRes })
  async getDocusignCommunicationDetails(
    @Param('contractId') contractId: string,
  ): Promise<ServiceResponse<GetDocusignCommunicationDetailsDto>> {
    const res = await this.contractService.getDocusignCommunicationDetails(contractId);
    return ServiceResponse.fromResult(res);
  }

  @Post()
  @ApiOperation({ summary: 'Save Contract' })
  @ApiOkResponse({ type: SaveContractRes })
  async saveContract(@Body() contractReq: SaveContractReqDto): Promise<ServiceResponse<SaveContractDto>> {
    const res = await this.contractService.saveContract(contractReq);
    return ServiceResponse.fromResult(res);
  }

  @Post('/send-contract')
  @ApiOperation({ summary: 'Send Contract' })
  @ApiOkResponse({ type: SendContractRes })
  @ApiQuery({ name: 'opportunity-id' })
  async sendContract(@Query('opportunity-id') opportunityId: string): Promise<ServiceResponse<SendContractDto>> {
    const res = await this.contractService.sendContract(opportunityId);
    return ServiceResponse.fromResult(res);
  }

  @Post('/change-orders')
  @ApiOperation({ summary: 'Save Contract' })
  @ApiOkResponse({ type: SaveChangeOrderRes })
  async saveChangeOrder(@Body() contractReq: SaveChangeOrderReqDto): Promise<ServiceResponse<SaveChangeOrderDto>> {
    const res = await this.contractService.saveChangeOrder(contractReq);
    return ServiceResponse.fromResult(res);
  }
}
