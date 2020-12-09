import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { DocusignTemplateMasterService } from './docusign-template-master.service';
import { GetSignerRoleMasterDto, GetSignerRoleMasterRes, GetTemplateMasterDto, GetTemplateMasterRes } from './res';

@ApiTags('Docusign Template Master')
@Controller('/docusign-template-master')
export class DocusignTemplateMasterController {
  constructor(private readonly docusignTemplateMasterService: DocusignTemplateMasterService) {}

  @Get()
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get Docusign Template Master' })
  @ApiOkResponse({ type: GetTemplateMasterRes })
  async getDocusignTemplateMaster(): Promise<ServiceResponse<GetTemplateMasterDto>> {
    const res = await this.docusignTemplateMasterService.getTemplateMasters();
    return ServiceResponse.fromResult(res);
  }

  @Get('/signer-roles')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get Signer Role Master' })
  @ApiOkResponse({ type: GetSignerRoleMasterRes })
  async createQualification(): Promise<ServiceResponse<GetSignerRoleMasterDto>> {
    const res = await this.docusignTemplateMasterService.getSignerRoleMasters();
    return ServiceResponse.fromResult(res);
  }
}
