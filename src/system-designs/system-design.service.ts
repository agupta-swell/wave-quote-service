import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationException, OperationResult, Pagination } from 'src/app/common';
import { ProductService } from './../products/product.service';
import { DESIGN_MODE } from './constants';
import { CreateSystemDesignDto } from './req/create-system-design.dto';
import { UpdateSystemDesignDto } from './req/update-system-design.dto';
import { SystemDesignDto } from './res/system-design.dto';
import { SystemProductService, UploadImageService } from './sub-services';
import { SystemDesign, SystemDesignModel, SYSTEM_DESIGN } from './system-design.schema';

@Injectable()
export class SystemDesignService {
  constructor(
    @InjectModel(SYSTEM_DESIGN) private readonly systemDesignModel: Model<SystemDesign>,
    private readonly productService: ProductService,
    private readonly systemProductService: SystemProductService,
    private readonly uploadImageService: UploadImageService,
  ) {}

  async create(systemDesignDto: CreateSystemDesignDto): Promise<OperationResult<SystemDesignDto>> {
    if (systemDesignDto.roofTopDesignData && systemDesignDto.capacityProductionDesignData) {
      throw new Error('Please put your data in body');
    }
    const thumbnail = await this.uploadImageService.uploadToAWSS3(systemDesignDto.thumbnail);
    const systemDesign = new SystemDesignModel(systemDesignDto);
    systemDesign.setThumbnail(thumbnail);
    if (systemDesign.design_mode === DESIGN_MODE.ROOF_TOP) {
      let cumulativeGenerationKWh = 0;
      let cumulativeCapacityKW = 0;
      const hashPanelModelIds = systemDesignDto.roofTopDesignData.panelArray.reduce(
        (acc, item, index) => ({ ...acc, [index]: item.panelModelId }),
        {},
      );

      systemDesign.roof_top_design_data.panel_array.forEach(async (item, index) => {
        const panelModelId = hashPanelModelIds[index];
        const panelModelData = await this.productService.getDetail(panelModelId);
        const data = { ...panelModelData, part_number: panelModelData.partNumber };
        systemDesign.addPanelModelDataSnapshot(data, index);
        //FIXME: need to verify the value of capacity
        const capacity = item.number_of_panels * panelModelData.sizeW;
        const acAnnual = await this.systemProductService.pvWatCalculation({
          lat: systemDesign.latitude,
          lon: systemDesign.longtitude,
          azimuth: item.azimuth,
          systemCapacity: capacity,
          tilt: item.pitch,
        });

        cumulativeGenerationKWh += acAnnual;
        cumulativeCapacityKW += capacity;
      });

      systemDesign.setSystemProductionData({
        capacityKW: cumulativeCapacityKW,
        generationKWh: cumulativeGenerationKWh,
        productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
        annual_usageKWh: 0,
        offset_percentage: 0,
      });
    }

    const createdSystemDesign = new this.systemDesignModel(systemDesign);
    await createdSystemDesign.save();

    return OperationResult.ok(new SystemDesignDto(createdSystemDesign));
  }

  async update(id: string, systemDesignDto: UpdateSystemDesignDto): Promise<OperationResult<SystemDesignDto>> {
    const foundSystemDesign = await this.systemDesignModel.findById(id);
    if (!foundSystemDesign) {
      throw ApplicationException.EnitityNotFound(id);
    }
    const thumbnail = await this.uploadImageService.uploadToAWSS3(systemDesignDto.thumbnail);
    const systemDesign = new SystemDesignModel(systemDesignDto);
    systemDesign.setThumbnail(thumbnail);
    if (systemDesign.design_mode === DESIGN_MODE.ROOF_TOP) {
      let cumulativeGenerationKWh = 0;
      let cumulativeCapacityKW = 0;
      const hashPanelModelIds = systemDesignDto.roofTopDesignData.panelArray.reduce(
        (acc, item, index) => ({ ...acc, [index]: item.panelModelId }),
        {},
      );

      systemDesign.roof_top_design_data.panel_array.forEach(async (item, index) => {
        const panelModelId = hashPanelModelIds[index];
        const panelModelData = await this.productService.getDetail(panelModelId);
        const data = { ...panelModelData, part_number: panelModelData.partNumber };
        systemDesign.addPanelModelDataSnapshot(data, index);
        //FIXME: need to verify the value of capacity
        const capacity = item.number_of_panels * panelModelData.sizeW;
        const acAnnual = await this.systemProductService.pvWatCalculation({
          lat: systemDesign.latitude,
          lon: systemDesign.longtitude,
          azimuth: item.azimuth,
          systemCapacity: capacity,
          tilt: item.pitch,
        });

        cumulativeGenerationKWh += acAnnual;
        cumulativeCapacityKW += capacity;
      });

      systemDesign.setSystemProductionData({
        capacityKW: cumulativeCapacityKW,
        generationKWh: cumulativeGenerationKWh,
        productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
        annual_usageKWh: 0,
        offset_percentage: 0,
      });
    }

    await foundSystemDesign.updateOne(systemDesign);
    return OperationResult.ok(new SystemDesignDto(foundSystemDesign));
  }

  async delete(id: string): Promise<OperationResult<string>> {
    const systemDesign = await this.systemDesignModel.findById(id);
    if (!systemDesign) {
      throw ApplicationException.EnitityNotFound(id);
    }
    await systemDesign.deleteOne();
    return OperationResult.ok('Deleted Successfully');
  }

  async getAllSystemDesigns(limit: number, skip: number): Promise<OperationResult<Pagination<SystemDesignDto>>> {
    const [systemDesigns, total] = await Promise.all([
      this.systemDesignModel.find().limit(limit).skip(skip).exec(),
      this.systemDesignModel.estimatedDocumentCount(),
    ]);
    const data = systemDesigns.map(item => new SystemDesignDto(item.toObject()));
    const result = {
      data,
      total,
    };
    return OperationResult.ok(result);
  }

  async getDetails(id: string): Promise<OperationResult<SystemDesignDto>> {
    const systemDesign = await this.systemDesignModel.findById(id);
    return OperationResult.ok(new SystemDesignDto(systemDesign.toObject()));
  }
}
