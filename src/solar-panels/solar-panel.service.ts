import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationException, OperationResult, Pagination } from 'src/app/common';
import { CreateSolarPanelDto } from './req/create-solar-panel.dto';
import { UpdateSolarPanelDto } from './req/update-solar-panel.dto';
import { SolarPanelDto } from './res/solar-panel.dto';
import { SolarPanel } from './solar-panel.schema';

@Injectable()
export class SolarPanelService {
  constructor(@InjectModel(SolarPanel.name) private solarPanelModel: Model<SolarPanel>) {}

  async create(solarPanelDto: CreateSolarPanelDto): Promise<OperationResult<{ id: string }>> {
    const createdSolarPanel = new this.solarPanelModel(solarPanelDto);
    await createdSolarPanel.save();
    return OperationResult.ok(createdSolarPanel._id);
  }

  async update(id: string, solarPanelDto: UpdateSolarPanelDto): Promise<OperationResult<{ id: string }>> {
    const solarPanel = await this.solarPanelModel.findById(id);
    if (!solarPanel) {
      throw ApplicationException.EnitityNotFound(id);
    }
    await solarPanel.updateOne(solarPanelDto);
    return OperationResult.ok(solarPanel._id);
  }

  async delete(id: string): Promise<OperationResult<string>> {
    const solarPanel = await this.solarPanelModel.findById(id);
    if (!solarPanel) {
      throw ApplicationException.EnitityNotFound(id);
    }
    await solarPanel.deleteOne();
    return OperationResult.ok('Deleted Successfully');
  }

  async getAllSolarPanels(): Promise<OperationResult<Pagination<SolarPanelDto>>> {
    const [solarPanels, total] = await Promise.all([
      this.solarPanelModel.find().exec(),
      this.solarPanelModel.estimatedDocumentCount(),
    ]);
    const data = solarPanels.map(item => new SolarPanelDto(item));
    const result = {
      data,
      total,
    };
    return OperationResult.ok(result);
  }
}
