import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { QualificationService } from './qualification.service';
import { CreateQualificationReqDto, SetManualApprovalReqDto } from './req';
import { GetQualificationDetailRes, ManualApprovalDto, ManualApprovalRes, QualificationRes } from './res';
import { GetQualificationDetailDto } from './res/get-qualification-detail.dto';

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
  ): Promise<ServiceResponse<ManualApprovalDto>> {
    const res = await this.qualificationService.createQualification(qualificationDto);
    return ServiceResponse.fromResult(res);
  }

  @Put(':qualificationId')
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
}
