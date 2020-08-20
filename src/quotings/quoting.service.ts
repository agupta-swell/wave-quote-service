import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { ApplicationException, OperationResult, Pagination } from 'src/app/common';
import { SolarPanelService } from '../solar-panels/solar-panel.service';
import { toSnakeCase } from '../utils/transformProperties';
import { Polygon, QUOTING, Quoting } from './quoting.schema';
import { CreateQuotingDto } from './req/create-quoting.dto';
import { UpdateQuotingDto } from './req/update-quoting.dto';
import { QuotingDto } from './res/quoting.dto';

@Injectable()
export class QuotingService {
  constructor(
    @InjectModel(QUOTING) private readonly quotingModel: Model<Quoting>,
    private readonly solarPanelService: SolarPanelService,
  ) {}

  async create(quotingDto: CreateQuotingDto): Promise<OperationResult<{ id: string }>> {
    const transformData = { ...quotingDto, polygons: quotingDto.polygons.map(item => toSnakeCase(item)) } as any;
    transformData.polygons.forEach((polygon: any) => {
      polygon._id = mongoose.Types.ObjectId();
    });
    const createdQuoting = new this.quotingModel(transformData);
    await createdQuoting.save();
    return OperationResult.ok(createdQuoting._id);
  }

  async update(id: string, quotingDto: UpdateQuotingDto): Promise<OperationResult<{ id: string }>> {
    const quoting = await this.quotingModel.findById(id);
    if (!quoting) {
      throw ApplicationException.EnitityNotFound(id);
    }
    const transformData = { ...quotingDto, polygons: quotingDto.polygons.map(item => toSnakeCase(item)) } as any;
    transformData.polygons.forEach((polygon: any) => {
      polygon._id = polygon.id || mongoose.Types.ObjectId();
    });
    console.log('>>>>>>>>>>>>>>>>>>>transformData', transformData);
    await quoting.updateOne(transformData);
    return OperationResult.ok(quoting._id);
  }

  async delete(id: string): Promise<OperationResult<string>> {
    const quoting = await this.quotingModel.findById(id);
    if (!quoting) {
      throw ApplicationException.EnitityNotFound(id);
    }
    await quoting.deleteOne();
    return OperationResult.ok('Deleted Successfully');
  }

  async getAllQuotings(): Promise<OperationResult<Pagination<{ id: string; name: string }>>> {
    const [quotings, total] = await Promise.all([
      this.quotingModel.find().exec(),
      this.quotingModel.estimatedDocumentCount(),
    ]);
    const data = quotings.map(item => QuotingDto.quotingListDto(item.toObject()));
    const result = {
      data,
      total,
    };
    return OperationResult.ok(result);
  }

  async getDetails(id: string): Promise<OperationResult<QuotingDto>> {
    const quoting = (await this.quotingModel.findById(id)).toObject();
    const polygons = await Promise.all(
      quoting.polygons.map(async (polygon: Polygon) => {
        const panel = await this.solarPanelService.getDetails(polygon.panel_id);
        (polygon as any).id = polygon._id;
        delete polygon._id;
        return {
          ...polygon,
          panel,
        };
      }),
    );

    return OperationResult.ok(new QuotingDto({ ...quoting, polygons }));
  }
}
