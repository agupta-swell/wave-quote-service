import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
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
  async getDocusignTemplateMaster(): Promise<ServiceResponse<GetTemplateMasterDto>> {
    const res = await this.docusignTemplateMasterService.getTemplateMasters();
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
  async getContractCompositeTemplates(): Promise<ServiceResponse<GetContractCompositeTemplateDto>> {
    const res = await this.docusignTemplateMasterService.getContractCompositeTemplates();
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
}
