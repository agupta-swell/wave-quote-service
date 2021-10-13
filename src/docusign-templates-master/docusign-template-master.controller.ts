import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { ServiceResponse } from 'src/app/common';
import { CONTRACT_TYPE } from 'src/contracts/constants';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { PreAuthenticate } from '../app/securities';
import { DocusignTemplateMasterService } from './docusign-template-master.service';
import { SaveContractCompositeTemplateReqDto, SaveTemplateReqDto } from './req';
import {
  GetContractApplicabilityDataDto,
  GetContractApplicabilityDataRes,
  GetContractCompositeTemplateDto,
  GetContractCompositeTemplateRes,
  GetSignerRoleMasterDto,
  GetSignerRoleMasterRes,
  GetTemplateMasterDto,
  GetTemplateMasterRes,
  SaveContractCompositeTemplateDto,
  SaveContractCompositeTemplateRes,
  SaveTemplateDto,
  SaveTemplateRes,
} from './res';

@ApiTags('Docusign Template Master')
@Controller('/docusign-templates-master')
export class DocusignTemplateMasterController {
  constructor(private readonly docusignTemplateMasterService: DocusignTemplateMasterService) {}

  @Get()
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get Docusign Templates Master' })
  @ApiOkResponse({ type: GetTemplateMasterRes })
  async getDocusignTemplatesMaster(): Promise<ServiceResponse<GetTemplateMasterDto>> {
    const res = await this.docusignTemplateMasterService.getTemplatesMaster();
    return ServiceResponse.fromResult(res);
  }

  @Get('/signer-roles')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get Signer Roles Master' })
  @ApiOkResponse({ type: GetSignerRoleMasterRes })
  async getSignerRoleMasters(): Promise<ServiceResponse<GetSignerRoleMasterDto>> {
    const res = await this.docusignTemplateMasterService.getSignerRoleMasters();
    return ServiceResponse.fromResult(res);
  }

  @Get('/composite-templates')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get Contract Composite Templates' })
  @ApiOkResponse({ type: GetContractCompositeTemplateRes })
  async getContractCompositeTemplates(
    @Query('type') type?: CONTRACT_TYPE,
  ): Promise<ServiceResponse<GetContractCompositeTemplateDto>> {
    const res = await this.docusignTemplateMasterService.getContractCompositeTemplates(type);
    return ServiceResponse.fromResult(res);
  }

  @Get('/contract-applicabilities')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get Contract Applicabilities' })
  @ApiOkResponse({ type: GetContractApplicabilityDataRes })
  async getContractApplicabilityData(): Promise<ServiceResponse<GetContractApplicabilityDataDto>> {
    const res = await this.docusignTemplateMasterService.getContractApplicabilityData();
    return ServiceResponse.fromResult(res);
  }

  @Post('/composite-templates')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Save Contract Composite Templates' })
  @ApiOkResponse({ type: SaveContractCompositeTemplateRes })
  async saveContractCompositeTemplate(
    @Body() req: SaveContractCompositeTemplateReqDto,
  ): Promise<ServiceResponse<SaveContractCompositeTemplateDto>> {
    const res = await this.docusignTemplateMasterService.saveContractCompositeTemplate(req);
    return ServiceResponse.fromResult(res);
  }

  @Post('/normal-template')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Save Template' })
  @ApiOkResponse({ type: SaveTemplateRes })
  async saveTemplate(@Body() req: SaveTemplateReqDto): Promise<ServiceResponse<SaveTemplateDto>> {
    const res = await this.docusignTemplateMasterService.saveTemplate(req);
    return ServiceResponse.fromResult(res);
  }

  @Delete('/composite-templates/:id')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Delete one composite template' })
  deleteCompositeTemplate(@Param('id', ParseObjectIdPipe) id: ObjectId): Promise<void> {
    return this.docusignTemplateMasterService.deleteCompositeTemplateById(id);
  }

  @Delete('/:id')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Delete one docusign template' })
  deleteTemplate(@Param('id', ParseObjectIdPipe) id: ObjectId): Promise<void> {
    return this.docusignTemplateMasterService.deleteTemplateById(id);
  }
}
