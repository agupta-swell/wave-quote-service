import { Controller, Get, Post, Body, Res, Redirect, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { DOCUSIGN_INTEGRATION_TYPE } from './constants';
import { DocusignIntegrationService } from './docusign-integration.service';
import { DocusignIntegrationReqDto } from './req/docusign-integration';
import { DocusignIntegrationResDto } from './res/docusign-integration';

@ApiTags('Docusign Integration')
@Controller('/docusign-integration')
export class DocusignIntegrationController {
  constructor(private readonly docusignIntegrationService: DocusignIntegrationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all docuSign integration' })
  @ApiOkResponse({ type: DocusignIntegrationResDto })
  async getAllDocusignIntegration(): Promise<ServiceResponse<DocusignIntegrationResDto[]>> {
    const result = await this.docusignIntegrationService.getAllDocusignIntegration();
    return ServiceResponse.fromResult(result);
  }

  @Post('/add-docusign-integration')
  @ApiOperation({ summary: 'Post Docusign JWT Information' })
  async addDocusignIntegration(@Body() data: DocusignIntegrationReqDto): Promise<void> {
    await this.docusignIntegrationService.addDocusignIntegration(data);
  }

  @Get('/:type')
  @ApiOperation({ summary: 'Add access token after consent' })
  @Redirect(`${process.env.WAVE_URL}/admin/docusign-integration`, 302)
  async addDocusignAccessTokenAfterConsent(@Param('type') type: DOCUSIGN_INTEGRATION_TYPE): Promise<void> {
    await this.docusignIntegrationService.addDocusignAccessTokenAfterConsent(type);
  }

  @Get('/jwt-token')
  @ApiOperation({ summary: 'Get JWT token uri' })
  @ApiOkResponse({ type: DocusignIntegrationResDto })
  async getJWTTokenUri(@Query('type') type: DOCUSIGN_INTEGRATION_TYPE): Promise<ServiceResponse<string>> {
    const result = await this.docusignIntegrationService.getJWTUri(type);
    return ServiceResponse.fromResult(result);
  }
}
