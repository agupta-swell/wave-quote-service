import { Body, Controller, Get, Headers, Param, Post, Put, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { OperationResult, ServiceResponse } from 'src/app/common';
import { CheckOpportunity } from 'src/app/opportunity.pipe';
import { FastifyRequest, FastifyResponse } from 'src/shared/fastify';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { PreAuthenticate } from '../app/securities';
import { ROLE } from './constants';
import { QualificationService } from './qualification.service';
import { CatchQualificationException } from './filters';
import {
  AgentDetailDto,
  ApplyCreditQualificationReqDto,
  CreateQualificationReqDto,
  GenerateTokenReqDto,
  GetApplicationDetailReqDto,
  RecieveFniDecisionReqDto,
  SendMailReqDto,
  SetApplicantConsentReqDto,
  SetManualApprovalReqDto,
} from './req';
import {
  ApplicantConsentDto,
  ApplicantConsentRes,
  GenerateTokenRes,
  GetApplicationDetailDto,
  GetApplicationDetailRes,
  GetQualificationDetailDto,
  GetQualificationDetailRes,
  ManualApprovalDto,
  ManualApprovalRes,
  QualificationDetailDto,
  QualificationRes,
  RecieveFniDecisionResDto,
  SendMailDto,
  SendMailRes,
} from './res';

@ApiTags('Qualification')
@Controller('/qualifications')
export class QualificationController {
  constructor(private readonly qualificationService: QualificationService) {}

  @Post()
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Create Qualification' })
  @ApiOkResponse({ type: QualificationRes })
  @CheckOpportunity()
  async createQualification(
    @Body() qualificationDto: CreateQualificationReqDto,
  ): Promise<ServiceResponse<QualificationDetailDto>> {
    const res = await this.qualificationService.createQualification(qualificationDto);
    return ServiceResponse.fromResult(res);
  }

  @Put(':id/re-initiate')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Re-initiate Qualification' })
  @ApiOkResponse({ type: QualificationRes })
  async reInitiateQualification(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
    @Body() agentDetail: AgentDetailDto,
  ): Promise<ServiceResponse<QualificationDetailDto>> {
    const res = await this.qualificationService.reInitiateQualification(id, agentDetail);
    return ServiceResponse.fromResult(res);
  }

  @Put(':qualificationId/applicant-consent')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiParam({ name: 'qualificationId', type: String })
  @ApiOperation({ summary: 'Set applicant consent' })
  @ApiOkResponse({ type: ApplicantConsentRes })
  async applicationConsent(
    @Param('qualificationId', ParseObjectIdPipe) id: ObjectId,
    @Body() applicantConsentDto: SetApplicantConsentReqDto,
  ): Promise<ServiceResponse<ApplicantConsentDto>> {
    const res = await this.qualificationService.setApplicantConsent(id, applicantConsentDto);
    return ServiceResponse.fromResult(res);
  }

  @Post('/token')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Generate token' })
  @ApiOkResponse({ type: GenerateTokenRes })
  @CheckOpportunity()
  async generateToken(@Body() req: GenerateTokenReqDto): Promise<ServiceResponse<{ token: string }>> {
    const res = await this.qualificationService.generateToken(
      req.qualificationCreditId,
      req.opportunityId,
      ROLE.SYSTEM,
    );
    return ServiceResponse.fromResult(OperationResult.ok({ token: res }));
  }

  @Post('/send-mails')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Send email to customers' })
  @ApiOkResponse({ type: SendMailRes })
  @CatchQualificationException()
  async sendMail(@Body() req: SendMailReqDto): Promise<ServiceResponse<SendMailDto>> {
    const res = await this.qualificationService.sendMail(req);
    return ServiceResponse.fromResult(res);
  }

  @Post('/resend-mails')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Resend email to customers' })
  @ApiOkResponse({ type: SendMailRes })
  async resendMail(@Body() req: SendMailReqDto): Promise<ServiceResponse<SendMailDto>> {
    const res = await this.qualificationService.resendMail(req);
    return ServiceResponse.fromResult(res);
  }

  @Put(':qualificationId/manual-approval')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiParam({ name: 'qualificationId', type: String })
  @ApiOperation({ summary: 'Manual Approval' })
  @ApiOkResponse({ type: ManualApprovalRes })
  async manualApproval(
    @Param('qualificationId', ParseObjectIdPipe) id: ObjectId,
    @Body() manualApprovalDto: SetManualApprovalReqDto,
  ): Promise<ServiceResponse<ManualApprovalDto>> {
    const res = await this.qualificationService.setManualApproval(id, manualApprovalDto);
    return ServiceResponse.fromResult(res);
  }

  @Get(':opportunityId')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get Qualification Detail By Opportunity Id' })
  @ApiOkResponse({ type: GetQualificationDetailRes })
  async getQualificationDetail(
    @Param('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<GetQualificationDetailDto>> {
    const res = await this.qualificationService.getQualificationDetail(opportunityId);
    return ServiceResponse.fromResult(res);
  }

  @Post('/fni-applications')
  @ApiOperation({ summary: 'Recieve FNI Qualification Decision Details' })
  @ApiOkResponse({ type:  RecieveFniDecisionResDto })
  @ApiResponse({ status: 400, type:  RecieveFniDecisionResDto})
  @ApiResponse({ status: 401, type:  RecieveFniDecisionResDto})
  @ApiResponse({ status: 405, type:  RecieveFniDecisionResDto})
  @CatchQualificationException()
  async receiveFniUpdate(
    @Body() req: RecieveFniDecisionReqDto,
    @Headers('fni-wave-communications') header: string,
    @Res() res: FastifyResponse,
  ): Promise<RecieveFniDecisionResDto> {
    const response = await this.qualificationService.receiveFniUpdate(req, header);

    return res.code(response.status).send(response.responseBody);
  }

  //  ================= specific token in body ==============

  @Post('/applications')
  @ApiOperation({ summary: 'Get Application Detail' })
  @ApiOkResponse({ type: GetApplicationDetailRes })
  @CatchQualificationException()
  async getApplicationDetails(
    @Body() req: GetApplicationDetailReqDto,
  ): Promise<ServiceResponse<GetApplicationDetailDto>> {
    const res = await this.qualificationService.getApplicationDetail(req);
    return ServiceResponse.fromResult(res);
  }

  @Post('/apply-credit-qualification')
  @ApiOperation({ summary: 'Apply Credit Qualification' })
  @ApiOkResponse({ type: String })
  @CatchQualificationException()
  async applyCreditQualification(
    @Body() req: ApplyCreditQualificationReqDto,
  ): Promise<ServiceResponse<{ responseStatus: string }>> {
    const res = await this.qualificationService.applyCreditQualification(req);
    return ServiceResponse.fromResult(res);
  }

  //  ================= specific token in body ==============
}
