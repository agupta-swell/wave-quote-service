import { Body, Headers, Req, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { OperationResult, ServiceResponse } from 'src/app/common';
import { CheckOpportunity } from 'src/app/opportunity.pipe';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { PreAuthenticate } from '../app/securities';
import { ROLE } from './constants';
import { QualificationService } from './qualification.service';
import {
  ApplyCreditQualificationReqDto,
  CreateQualificationReqDto,
  GenerateTokenReqDto,
  GetApplicationDetailReqDto,
  SendMailReqDto,
  SetApplicantConsentReqDto,
  SetManualApprovalReqDto,
  RecieveFniDecisionReqDto,
  /*  TODO: move location of below Dto class to ./res folder */
  RecieveFniDecisionResDto
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
  SendMailDto,
  SendMailRes,
} from './res';
import { Request } from 'express';

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
    const res = await this.qualificationService.generateToken(req.qualificationCreditId, req.opportunityId, ROLE.AGENT);
    return ServiceResponse.fromResult(OperationResult.ok({ token: res }));
  }

  @Post('/send-mails')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Send email to customers' })
  @ApiOkResponse({ type: SendMailRes })
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


  @Put('/fni-applications')
  @ApiOperation({ summary: 'Recieve FNI Qualification Decision Details' })
  @ApiOkResponse({ type:  RecieveFniDecisionReqDto })
  async receiveFniUpdate(
    @Req() req: Request,
    @Headers('x-swell-token') header: string
  ): Promise<RecieveFniDecisionResDto>{
    const res = await this.qualificationService.receiveFniUpdate(req.body, header);
    return res;
  }
 
  //  ================= specific token in body ==============

  @Post('/applications')
  @ApiOperation({ summary: 'Get Application Detail' })
  @ApiOkResponse({ type: GetApplicationDetailRes })
  async getApplicationDetails(
    @Body() req: GetApplicationDetailReqDto,
  ): Promise<ServiceResponse<GetApplicationDetailDto>> {
    const res = await this.qualificationService.getApplicationDetail(req);
    return ServiceResponse.fromResult(res);
  }

  @Post('/apply-credit-qualification')
  @ApiOperation({ summary: 'Apply Credit Qualification' })
  @ApiOkResponse({ type: String })
  async applyCreditQualification(
    @Body() req: ApplyCreditQualificationReqDto,
  ): Promise<ServiceResponse<{ responseStatus: string }>> {
    const res = await this.qualificationService.applyCreditQualification(req);
    return ServiceResponse.fromResult(res);
  }

  //  ================= specific token in body ==============
}
