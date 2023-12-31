import { Body, Controller, Get, Head, Param, Post, Put, Query, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { ServiceResponse } from 'src/app/common';
import { CurrentUser, ILoggedInUser, PreAuthenticate } from 'src/app/securities';
import { ResourceGuard } from 'src/app/securities/resource-guard.decorator';
import { CatchDocusignException } from 'src/docusign-communications/filters';
import { ReplaceInstalledProductAfterSuccess } from 'src/installed-products/interceptors';
import { UseDocusignContext } from 'src/shared/docusign';
import { ParseDatePipe } from 'src/shared/pipes/parse-date.pipe';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { FastifyFile, FastifyResponse } from '../shared/fastify';
import { CONTRACT_SECRET_PREFIX, CONTRACT_TYPE } from './constants';
import { Contract } from './contract.schema';
import { ContractService } from './contract.service';
import { UseWetSignContract, VoidRelatedContracts } from './interceptors';
import { IContractWithDetailedQuote } from './interceptors/wet-sign-contract.interceptor';
import { ChangeOrderValidationPipe, SignerValidationPipe, UseDefaultFinancier, VoidPrimaryContractPipe } from './pipes';
import { DownloadContractPipe, IContractDownloadReqPayload } from './pipes/download-contract.validation.pipe';
import { SaveChangeOrderReqDto, SaveContractReqDto } from './req';
import {
  ContractResDetailDto,
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

// @ts-ignore
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
    @Query('financier-id') financierId: string,
    @Query('financial-product-id') financialProductId: string,
    @Query('contract-type') contractType: CONTRACT_TYPE,
    @Query('system-design-id') systemDesignId: string,
    @Query('quote-id') quoteId: string,
  ): Promise<ServiceResponse<GetContractTemplatesDto>> {
    const res = await this.contractService.getContractTemplates(
      opportunityId,
      fundingSourceId,
      financierId,
      financialProductId,
      contractType,
      systemDesignId,
      quoteId,
    );
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

  @Post(':contractId/generate-gsp-contract')
  @UsePipes(ValidationPipe)
  @UseDocusignContext()
  @ApiOperation({ summary: 'Generate GSP Contract' })
  @ApiOkResponse({ type: SendContractRes })
  async generateGSPContract(@Param('contractId') contractId: string): Promise<ServiceResponse<SendContractDto>> {
    const res = await this.contractService.sendGSPContract(contractId, true);
    return ServiceResponse.fromResult(res);
  }

  @Post('/save-gsp-contract')
  @UsePipes(ValidationPipe)
  @UseDocusignContext()
  @ApiOperation({ summary: 'Save GSP Contract' })
  @ApiOkResponse({ type: SaveContractRes })
  async saveGSPContract(
    @Body(SignerValidationPipe)
    contractReq: SaveContractReqDto,
  ): Promise<ServiceResponse<SaveContractDto>> {
    const res = await this.contractService.saveGSPContract(contractReq);
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

  @Post(':contractId/send-gsp-contract')
  @UseDocusignContext()
  @ApiOperation({ summary: 'Send GSP Contract' })
  @ApiOkResponse({ type: SendContractRes })
  async sendGSPContract(@Param('contractId') contractId: string): Promise<ServiceResponse<SendContractDto>> {
    const res = await this.contractService.sendGSPContract(contractId);
    return ServiceResponse.fromResult(res);
  }

  @Post('/change-orders')
  @UsePipes(ValidationPipe)
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
  @UseDocusignContext()
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

  @ResourceGuard(CONTRACT_SECRET_PREFIX)
  @Get('/GSPdownload/:name')
  @UseDocusignContext()
  @ApiParam({ name: 'contractId' })
  @ApiOperation({ summary: 'Download Contract envelope' })
  async downloadGSPContract(
    @CurrentUser(DownloadContractPipe) contractReq: IContractDownloadReqPayload,
    @Query('viewOnly') viewOnly: string | undefined,
    @Res() res: any,
  ) {
    const contract = await this.contractService.downloadGSPDocusignContract(
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

  @Head('/:contractId/GSPenvelope')
  @ApiParam({ name: 'contractId' })
  @ApiOperation({ summary: 'Head Contract envelope download data' })
  async streamGSPContract(
    @Param('contractId', ParseObjectIdPipe) id: ObjectId,
    @Query('fullName') fullName: string,
    @CurrentUser() user: ILoggedInUser,
    @Res() res: any,
  ) {
    const [filename, token] = await this.contractService.getGSPContractDownloadData(id, user, fullName);
    res
      .code(200)
      .header('Access-Control-Expose-Headers', ['X-Wave-Download-Token', 'X-Wave-Download-Filename'])
      .header('X-Wave-Download-Filename', filename)
      .header('X-Wave-Download-Token', token)
      .type('application/pdf')
      .send();
  }

  @Post('/:contractId/resend')
  @UseDocusignContext()
  @ApiOperation({ summary: 'Resend Contract' })
  @ApiOkResponse({ type: SendContractRes })
  async resendContract(
    @Param('contractId', ParseObjectIdPipe) contractId: ObjectId,
  ): Promise<ServiceResponse<{ success: boolean }>> {
    const res = await this.contractService.resendContract(contractId);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:contractId/wet-sign')
  @UseDocusignContext()
  @ApiOperation({ summary: 'Upload wet signed contract' })
  @UseWetSignContract('contractId')
  async updateWetSignedContract(
    @Param('contractId') contract: IContractWithDetailedQuote,
    @Body() file: FastifyFile,
  ): Promise<ServiceResponse<SendContractDto>> {
    const res = await this.contractService.sendContractByWetSigned(contract.contract, contract.quote, file);
    return ServiceResponse.fromResult(res);
  }

  @Post('/:contractId/void')
  @UseDocusignContext()
  @VoidRelatedContracts()
  @ApiOperation({ summary: 'Void Contract' })
  @ApiOkResponse({ type: SaveContractRes })
  async voidContract(
    @CurrentUser() user: ILoggedInUser,
    @Param('contractId', ParseObjectIdPipe, VoidPrimaryContractPipe) contract: Contract,
  ): Promise<Contract> {
    await this.contractService.voidContract(contract, true, user);
    return contract;
  }

  @Post('/:contractId/voidGSP')
  @UseDocusignContext()
  @VoidRelatedContracts()
  @ApiOperation({ summary: 'Void Contract' })
  @ApiOkResponse({ type: SaveContractRes })
  async voidGSPContract(
    @Param('contractId', ParseObjectIdPipe, VoidPrimaryContractPipe) contract: Contract,
  ): Promise<Contract> {
    await this.contractService.voidGSPContract(contract);
    return contract;
  }

  @Get('/:contractId')
  @ApiOperation({ summary: 'Check if contract modified since specific time' })
  @ApiResponse({ status: 304, description: 'Contract has not been modified' })
  @ApiResponse({ status: 200, description: 'Detailed contract', type: ContractResDetailDto })
  async checkLastModified(
    @Param('contractId', ParseObjectIdPipe) contractId: ObjectId,
    @Query('since', ParseDatePipe) since: Date,
    @Res() res: FastifyResponse,
  ): Promise<void> {
    const contract = await this.contractService.getContractSinceLastModified(contractId, since);

    if (contract) {
      res.send(ServiceResponse.fromResult(contract));
      return;
    }

    res.status(304).send();
  }
}
