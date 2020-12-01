import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { QualificationService } from './qualification.service';
import {
  ApplyCreditQualificationReqDto,
  CreateQualificationReqDto,
  GetApplicationDetailReqDto,
  SendMailReqDto,
  SetManualApprovalReqDto,
} from './req';
import {
  GetApplicationDetailDto,
  GetApplicationDetailRes,
  GetQualificationDetailDto,
  GetQualificationDetailRes,
  ManualApprovalDto,
  ManualApprovalRes,
  QualificationDto,
  QualificationRes,
  SendMailDto,
  SendMailRes,
} from './res';

@ApiTags('Qualification')
@Controller('/qualifications')
export class QualificationController {
  constructor(private qualificationService: QualificationService) {}

  @Post()
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Create Qualification' })
  @ApiOkResponse({ type: QualificationRes })
  async createQualification(
    @Body() qualificationDto: CreateQualificationReqDto,
  ): Promise<ServiceResponse<QualificationDto>> {
    const res = await this.qualificationService.createQualification(qualificationDto);
    return ServiceResponse.fromResult(res);
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

  @Put(':qualificationId/manual-approval')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Manual Approval' })
  @ApiOkResponse({ type: ManualApprovalRes })
  async manualApproval(
    @Param('qualificationId') id: string,
    @Body() manualApprovalDto: SetManualApprovalReqDto,
  ): Promise<ServiceResponse<ManualApprovalDto>> {
    const res = await this.qualificationService.setManualApproval(id, manualApprovalDto);
    return ServiceResponse.fromResult(res);
  }

  @Get(':opportunityId')
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get Qualification Detail' })
  @ApiOkResponse({ type: GetQualificationDetailRes })
  async getQualificationDetail(
    @Param('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<GetQualificationDetailDto>> {
    const res = await this.qualificationService.getQualificationDetail(opportunityId);
    return ServiceResponse.fromResult(res);
  }

  //  ================= specific token in body ==============

  @Get(':qualificationId/applications')
  @ApiOperation({ summary: 'Get Application Detail' })
  @ApiQuery({ name: 'qualificationCreditId' })
  @ApiQuery({ name: 'opportunityId' })
  @ApiQuery({ name: 'token' })
  @ApiOkResponse({ type: GetApplicationDetailRes })
  async getApplicationDetails(
    @Param('qualificationId') id: string,
    @Query() req: GetApplicationDetailReqDto,
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
