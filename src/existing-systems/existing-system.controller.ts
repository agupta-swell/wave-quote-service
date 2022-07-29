import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { ExistingSystemService } from './existing-system.service';
import { ICreateExistingSystem } from './interfaces/create-existing-system.interface';
import { ValidateCreateExistingSystemPipe } from './pipes';
import { CreateExistingSystemDto, UpdateExistingSystemDto } from './req';
import { ExistingSystemResDto } from './res';

@ApiTags('Existing Systems')
@ApiBearerAuth()
@Controller('existing-systems')
@PreAuthenticate()
export class ExistingSystemController {
  constructor(private readonly existingSystemService: ExistingSystemService) {}

  @Get('/:id')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Get one existing system by id' })
  @ApiOkResponse()
  async getOne(@Param('id', ParseObjectIdPipe) id: ObjectId): Promise<ServiceResponse<ExistingSystemResDto>> {
    const res = await this.existingSystemService.getOne(id);
    return ServiceResponse.fromResult(res);
  }

  @Post()
  @ApiOperation({ summary: 'Create existing system' })
  async create(
    @Body(ValidateCreateExistingSystemPipe) existingSystem: CreateExistingSystemDto,
  ): Promise<ServiceResponse<ExistingSystemResDto>> {
    const res = await this.existingSystemService.createValidatedBody(<ICreateExistingSystem>(<unknown>existingSystem));
    return ServiceResponse.fromResult(res);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update existing system' })
  async update(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
    @Body(ValidateCreateExistingSystemPipe) existingSystem: UpdateExistingSystemDto,
  ): Promise<ServiceResponse<ExistingSystemResDto>> {
    const res = await this.existingSystemService.updateValidatedBody(
      id,
      <ICreateExistingSystem>(<unknown>existingSystem),
    );
    return ServiceResponse.fromResult(res);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete existing system' })
  async delete(@Param('id', ParseObjectIdPipe) id: ObjectId): Promise<void> {
    return this.existingSystemService.deleteOne(id);
  }
}
