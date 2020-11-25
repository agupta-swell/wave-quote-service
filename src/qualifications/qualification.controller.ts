import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { QualificationService } from './qualification.service';
import { CreateQualificationDto, SetManualApprovalDto } from './req';
import {
  GetQualificationDetailDto,
  GetQualificationDetailRes,
  ManualApprovalDto,
  ManualApprovalRes,
  QualificationRes,
} from './res';

@ApiTags('Qualification')
@Controller('/qualifications')
export class QualificationController {
  constructor(private qualificationService: QualificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create Qualification' })
  @ApiOkResponse({ type: QualificationRes })
  async createQualification(
    @Body() qualificationDto: CreateQualificationDto,
  ): Promise<ServiceResponse<ManualApprovalDto>> {
    const res = await this.qualificationService.createQualification(qualificationDto);
    return ServiceResponse.fromResult(res);
  }

  @Put(':qualificationId')
  @ApiOperation({ summary: 'Manual Approval' })
  @ApiOkResponse({ type: ManualApprovalRes })
  async manualApproval(
    @Param('qualificationId') id: string,
    @Body() manualApprovalDto: SetManualApprovalDto,
  ): Promise<ServiceResponse<ManualApprovalDto>> {
    const res = await this.qualificationService.setManualApproval(id, manualApprovalDto);
    return ServiceResponse.fromResult(res);
  }

  @Get(':qualificationId')
  @ApiOperation({ summary: 'Get Qualification Detail' })
  @ApiOkResponse({ type: GetQualificationDetailRes })
  async getQualificationDetail(
    @Param('qualificationId') id: string,
  ): Promise<ServiceResponse<GetQualificationDetailDto>> {
    const res = await this.qualificationService.getQualificationDetail(id);
    return ServiceResponse.fromResult(res);
  }
}
