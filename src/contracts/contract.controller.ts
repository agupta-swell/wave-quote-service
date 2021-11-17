import { Body, Controller, Get, Head, Param, Post, Put, Query, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { ServiceResponse } from 'src/app/common';
import { CurrentUser, ILoggedInUser, PreAuthenticate } from 'src/app/securities';
import { ResourceGuard } from 'src/app/securities/resource-guard.decorator';
import { CatchDocusignException } from 'src/docusign-communications/filters';
import { ReplaceInstalledProductAfterSuccess } from 'src/installed-products/interceptors';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { UseDocusignContext } from 'src/shared/docusign';
import { CONTRACT_SECRET_PREFIX, CONTRACT_TYPE } from './constants';
import { ContractService } from './contract.service';
import { UseDefaultContractName, UseWetSignContract } from './interceptors';
import { ChangeOrderValidationPipe, SignerValidationPipe, UseDefaultFinancier } from './pipes';
import { DownloadContractPipe, IContractDownloadReqPayload } from './pipes/download-contract.validation.pipe';
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
  SendContractReq,
  SendContractRes,
} from './res';
import { FastifyFile } from '../shared/fastify';
import { IContractWithDetailedQuote } from './interceptors/wet-sign-contract.interceptor';

@ApiTags('Contract')
@ApiBearerAuth()
@Controller('/contracts')
@PreAuthenticate()
@CatchDocusignException()
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
    @Query('contract-type') contractType: CONTRACT_TYPE,
  ): Promise<ServiceResponse<GetContractTemplatesDto>> {
    const res = await this.contractService.getContractTemplates(opportunityId, fundingSourceId, contractType);
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

  @Post(':contractId/preview')
  @UseDocusignContext()
  @ApiOperation({ summary: 'Create draft contract' })
  @ApiOkResponse({ type: SendContractRes })
  async generatePreviewContract(
    @Param('contractId', ParseObjectIdPipe) id: ObjectId,
  ): Promise<ServiceResponse<SendContractDto>> {
    const res = await this.contractService.sendContract(id.toString(), true);
    return ServiceResponse.fromResult(res);
  }

  @Post()
  @UsePipes(ValidationPipe)
  @UseDefaultFinancier()
  @UseDefaultContractName()
  @ApiOperation({ summary: 'Save Contract' })
  @ReplaceInstalledProductAfterSuccess()
  @ApiOkResponse({ type: SaveContractRes })
  async saveContract(
    @Body(SignerValidationPipe)
    contractReq: SaveContractReqDto,
  ): Promise<ServiceResponse<SaveContractDto>> {
    const res = await this.contractService.saveContract(contractReq);
    return ServiceResponse.fromResult(res);
  }

  @Post('/send-contract')
  @UseDocusignContext()
  @ApiOperation({ summary: 'Send Contract' })
  @ApiOkResponse({ type: SendContractRes })
  async sendContract(@Body() sendContractReq: SendContractReq): Promise<ServiceResponse<SendContractDto>> {
    const { contractId } = sendContractReq;
    const res = await this.contractService.sendContract(contractId);
    return ServiceResponse.fromResult(res);
  }

  @Post('/change-orders')
  @UsePipes(ValidationPipe)
  @UseDefaultContractName()
  @ReplaceInstalledProductAfterSuccess()
  @ApiOperation({ summary: 'Save Contract' })
  @ApiOkResponse({ type: SaveChangeOrderRes })
  async saveChangeOrder(
    @Body(ChangeOrderValidationPipe) contractReq: SaveChangeOrderReqDto,
  ): Promise<ServiceResponse<SaveChangeOrderDto>> {
    const res = await this.contractService.saveChangeOrder(contractReq as any);
    return ServiceResponse.fromResult(res);
  }

  @ResourceGuard(CONTRACT_SECRET_PREFIX)
  @Get('/download/:name')
  @ApiParam({ name: 'contractId' })
  @ApiOperation({ summary: 'Download Contract envelope' })
  async downloadContract(
    @CurrentUser(DownloadContractPipe) contractReq: IContractDownloadReqPayload,
    @Query('viewOnly') viewOnly: string | undefined,
    @Res() res: any,
  ) {
    const contract = await this.contractService.downloadDocusignContract(
      contractReq.envelopeId,
      contractReq.showChanges,
    );

    if (viewOnly) {
      res.header('Content-Disposition', `inline; filename="${contractReq.filename}"`);
    } else {
      res.header('Content-Disposition', `attachment; filename="${contractReq.filename}"`);
    }

    res.code(200).header('Content-Type', contractReq.contentType).type('application/pdf').send(contract);
  }

  @Head('/:contractId/envelope')
  @ApiParam({ name: 'contractId' })
  @ApiOperation({ summary: 'Head Contract envelope download data' })
  async streamContract(
    @Param('contractId', ParseObjectIdPipe) id: ObjectId,
    @CurrentUser() user: ILoggedInUser,
    @Res() res: any,
  ) {
    const [filename, token] = await this.contractService.getContractDownloadData(id, user);
    res
      .code(200)
      .header('Access-Control-Expose-Headers', ['X-Wave-Download-Token', 'X-Wave-Download-Filename'])
      .header('X-Wave-Download-Filename', filename)
      .header('X-Wave-Download-Token', token)
      .type('application/pdf')
      .send();
  }

  @Post('/:contractId/resend')
  @ApiOperation({ summary: 'Resend Contract' })
  @ApiOkResponse({ type: SendContractRes })
  async resendContract(
    @Param('contractId', ParseObjectIdPipe) contractId: ObjectId,
  ): Promise<ServiceResponse<{ success: boolean }>> {
    const res = await this.contractService.resendContract(contractId);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:contractId/wet-sign')
  @ApiOperation({ summary: 'Upload wet signed contract' })
  @UseWetSignContract('contractId')
  async updateWetSignedContract(
    @Param('contractId') contract: IContractWithDetailedQuote,
    @Body() file: FastifyFile,
  ): Promise<ServiceResponse<SendContractDto>> {
    const res = await this.contractService.sendContractByWetSigned(contract.contract, contract.quote, file);
    return ServiceResponse.fromResult(res);
  }
}
