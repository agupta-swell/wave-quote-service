import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { DocusignIntegrationService } from './docusign-integration.service';
import { DocusignIntegrationReqDto } from './req/docusign-integration';
import { DocusignIntegrationResDto } from './res/docusign-integration';

@ApiTags('Docusign Integration')
@Controller('/docusign-integration')
export class DocusignIntegrationController {
  constructor(private readonly docusignIntegrationService: DocusignIntegrationService) {}

  @Get()
  @ApiOperation({ summary: 'Get Docusign JWT Information' })
  @ApiOkResponse({ type: DocusignIntegrationResDto })
  async getOneDocusignIntegration(): Promise<ServiceResponse<DocusignIntegrationResDto>> {
    const result = await this.docusignIntegrationService.getOneDocusignIntegration();
    return ServiceResponse.fromResult(result);
  }

  @Post('/add-docusign-integration')
  @ApiOperation({ summary: 'Post Docusign JWT Information' })
  async addDocusignIntegration(@Body() data: DocusignIntegrationReqDto): Promise<void> {
    await this.docusignIntegrationService.addDocusignIntegration(data);
  }

  @Post('/add-docusign-access-token-after-consent')
  @ApiOperation({ summary: 'Add access token after consent' })
  async addDocusignAccessTokenAfterConsent(): Promise<void> {
    await this.docusignIntegrationService.addDocusignAccessTokenAfterConsent();
  }

  @Get('/jwt-token')
  @ApiOperation({ summary: 'Get JWT token uri' })
  @ApiOkResponse({ type: DocusignIntegrationResDto })
  async getJWTTokenUri(): Promise<ServiceResponse<string>> {
    const result = await this.docusignIntegrationService.getJWTUri();
    return ServiceResponse.fromResult(result);
  }
}
