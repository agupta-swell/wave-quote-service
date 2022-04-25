import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { ApplicationException } from '../app/app.exception';
import { OperationResult } from '../app/common';
import { strictPlainToClass } from '../shared/transform/strict-plain-to-class';
import { CreateSystemProductionDto, UpdateSystemProductionDto } from './req';
import { SystemProductionDto } from './res';
import { ISystemProduction, SYSTEM_PRODUCTION } from './system-production.schema';

@Injectable()
export class SystemProductionService {
  constructor(
    @InjectModel(SYSTEM_PRODUCTION) private readonly systemProductionModel: Model<ISystemProduction>,
    private readonly s3Service: S3Service,
  ) {}

  async findById(id: string | ObjectId): Promise<OperationResult<SystemProductionDto>> {
    const foundSystemProduction = await this.systemProductionModel.findById(id).lean();
    if (!foundSystemProduction) {
      throw ApplicationException.EntityNotFound(`SystemProductionId: ${id.toString()}`);
    }
    return OperationResult.ok(strictPlainToClass(SystemProductionDto, foundSystemProduction));
  }

  async create(data: CreateSystemProductionDto): Promise<OperationResult<SystemProductionDto>> {
    const createdSystemProduction = new this.systemProductionModel(data);
    await createdSystemProduction.save();
    return OperationResult.ok(strictPlainToClass(SystemProductionDto, createdSystemProduction.toJSON()));
  }

  async update(id: string | ObjectId, data: UpdateSystemProductionDto): Promise<OperationResult<SystemProductionDto>> {
    const foundSystemProduction = await this.systemProductionModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!foundSystemProduction) {
      throw ApplicationException.EntityNotFound(`SystemProductionId: ${id.toString()}`);
    }
    return OperationResult.ok(strictPlainToClass(SystemProductionDto, foundSystemProduction.toJSON()));
  }

  async delete(id: string | ObjectId): Promise<OperationResult<string>> {
    const foundSystemProduction = await this.systemProductionModel.findById(id);
    if (!foundSystemProduction) {
      throw ApplicationException.EntityNotFound(`SystemProductionId: ${id.toString()}`);
    }
    foundSystemProduction.deleteOne();
    return OperationResult.ok(`Deleted SystemProductionId: ${id.toString()}Successfully`);
  }
}
