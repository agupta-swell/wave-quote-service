import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { flatten, pickBy } from 'lodash';
import { Model, Types } from 'mongoose';
import { OperationResult, Pagination } from 'src/app/common';
import { AdderConfigService } from '../adder-config/adder-config.service';
import { ApplicationException } from '../app/app.exception';
import { UtilityService } from '../utilities/utility.service';
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
    private readonly utilityService: UtilityService,
    private readonly adderConfigService: AdderConfigService,
  ) {}

  async create(systemDesignDto: CreateSystemDesignDto): Promise<OperationResult<SystemDesignDto>> {
    if (systemDesignDto.roofTopDesignData && systemDesignDto.capacityProductionDesignData) {
      throw new Error('Please put your data in body');
    }

    const systemDesign = new SystemDesignModel(systemDesignDto);
    if (systemDesign.design_mode === DESIGN_MODE.ROOF_TOP) {
      let cumulativeGenerationKWh = 0;
      let cumulativeCapacityKW = 0;

      const [thumbnail] = await Promise.all(
        flatten([
          this.uploadImageService.uploadToAWSS3(systemDesignDto.thumbnail) as any,
          systemDesign.roof_top_design_data.panel_array.map(async (item, index) => {
            item.array_id = Types.ObjectId();
            const panelModelId = systemDesignDto.roofTopDesignData.panelArray[index].panelModelId;
            item.panel_model_id = panelModelId;
            const panelModelData = await this.productService.getDetail(panelModelId);
            const data = { ...panelModelData.toObject(), part_number: panelModelData.partNumber };
            systemDesign.setPanelModelDataSnapshot(data, index);
            const capacity = (item.number_of_panels * panelModelData.sizeW) / 1000;
            const acAnnual = await this.systemProductService.pvWatCalculation({
              lat: systemDesign.latitude,
              lon: systemDesign.longtitude,
              azimuth: item.azimuth,
              systemCapacity: capacity,
              tilt: item.pitch,
            });
            cumulativeGenerationKWh += acAnnual;
            cumulativeCapacityKW += capacity;
          }),
          systemDesign.roof_top_design_data.adders.map(async (item, index) => {
            const adder = await this.adderConfigService.getAdderConfigDetail(item.adder_id);
            systemDesign.setAdder({ ...adder, modified_at: adder.modifiedAt }, index);
          }),
          systemDesign.roof_top_design_data.inverters.map(async (inverter, index) => {
            const inverterModelData = await this.productService.getDetail(inverter.inverter_model_id);
            const data = { ...inverterModelData.toObject(), part_number: inverterModelData.partNumber };
            systemDesign.setInverter(data, index);
          }),
          systemDesign.roof_top_design_data.storage.map(async (storage, index) => {
            const storageModelData = await this.productService.getDetail(storage.storage_model_id);
            const data = { ...storageModelData.toObject(), part_number: storageModelData.partNumber };
            systemDesign.setStorage(data, index);
          }),
        ]),
      );

      systemDesign.setThumbnail(thumbnail);
      systemDesign.setIsSelected(systemDesignDto.isSelected);

      const annualUsageKWh =
        (await this.utilityService.getUtilityByOpportunityId(systemDesignDto.opportunityId))?.utility_data
          .typical_baseline_usage?.annual_consumption || 0;

      systemDesign.setSystemProductionData({
        capacityKW: cumulativeCapacityKW,
        generationKWh: cumulativeGenerationKWh,
        productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
        annual_usageKWh: annualUsageKWh,
        offset_percentage: annualUsageKWh > 0 ? cumulativeGenerationKWh / annualUsageKWh : 0,
      });
    }

    const createdSystemDesign = new this.systemDesignModel(systemDesign);
    await createdSystemDesign.save();

    return OperationResult.ok(new SystemDesignDto(createdSystemDesign.toObject()));
  }

  async update(id: string, systemDesignDto: UpdateSystemDesignDto): Promise<OperationResult<SystemDesignDto>> {
    const foundSystemDesign = await this.systemDesignModel.findById(id);

    if (!foundSystemDesign) {
      throw ApplicationException.EnitityNotFound(id);
    }

    const systemDesign = new SystemDesignModel(pickBy(systemDesignDto, item => typeof item !== 'undefined') as any);

    if (systemDesignDto.name) {
      systemDesign.name = systemDesignDto.name;
    }

    if (systemDesignDto.isSelected) {
      systemDesign.setIsSelected(systemDesignDto.isSelected);
    }

    if (systemDesignDto.isSolar) {
      systemDesign.setIsSolar(systemDesignDto.isSolar);
    }

    if (systemDesignDto.isRetrofit) {
      systemDesign.setIsRetrofit(systemDesignDto.isRetrofit);
    }

    if (systemDesign.design_mode === DESIGN_MODE.ROOF_TOP) {
      let cumulativeGenerationKWh = 0;
      let cumulativeCapacityKW = 0;

      if (systemDesignDto.thumbnail) {
        const [thumbnail] = await Promise.all([
          this.uploadImageService.uploadToAWSS3(systemDesignDto.thumbnail),
          this.uploadImageService.deleteFileS3(foundSystemDesign.thumbnail),
        ]);
        systemDesign.setThumbnail(thumbnail);
      }
      if (typeof systemDesignDto.isSelected === 'boolean') {
        systemDesign.setIsSelected(systemDesignDto.isSelected);
      }

      if (systemDesignDto.roofTopDesignData) {
        await Promise.all(
          flatten([
            systemDesign.roof_top_design_data.panel_array.map(async (item, index) => {
              item.array_id = Types.ObjectId();
              const panelModelId = systemDesignDto.roofTopDesignData.panelArray[index].panelModelId;
              item.panel_model_id = panelModelId;
              const panelModelData = await this.productService.getDetail(panelModelId);
              const data = { ...panelModelData.toObject(), part_number: panelModelData.partNumber };
              systemDesign.setPanelModelDataSnapshot(data, index);
              const capacity = (item.number_of_panels * panelModelData.sizeW) / 1000;
              const acAnnual = await this.systemProductService.pvWatCalculation({
                lat: systemDesign.latitude,
                lon: systemDesign.longtitude,
                azimuth: item.azimuth,
                systemCapacity: capacity,
                tilt: item.pitch,
              });
              cumulativeGenerationKWh += acAnnual;
              cumulativeCapacityKW += capacity;
            }),
            systemDesign.roof_top_design_data.adders.map(async (item, index) => {
              const adder = await this.adderConfigService.getAdderConfigDetail(item.adder_id);
              systemDesign.setAdder({ ...adder, modified_at: adder.modifiedAt }, index);
            }),
            systemDesign.roof_top_design_data.inverters.map(async (inverter, index) => {
              const inverterModelData = await this.productService.getDetail(inverter.inverter_model_id);
              const data = { ...inverterModelData.toObject(), part_number: inverterModelData.partNumber };
              systemDesign.setInverter(data, index);
            }),
            systemDesign.roof_top_design_data.storage.map(async (storage, index) => {
              const storageModelData = await this.productService.getDetail(storage.storage_model_id);
              const data = { ...storageModelData.toObject(), part_number: storageModelData.partNumber };
              systemDesign.setStorage(data, index);
            }),
          ]),
        );

        const annualUsageKWh =
          (await this.utilityService.getUtilityByOpportunityId(systemDesignDto.opportunityId))?.utility_data
            .typical_baseline_usage?.annual_consumption || 0;

        systemDesign.setSystemProductionData({
          capacityKW: cumulativeCapacityKW,
          generationKWh: cumulativeGenerationKWh,
          productivity: cumulativeCapacityKW === 0 ? 0 : cumulativeGenerationKWh / cumulativeCapacityKW,
          annual_usageKWh: annualUsageKWh,
          offset_percentage: annualUsageKWh > 0 ? cumulativeGenerationKWh / annualUsageKWh : 0,
        });
      }
    }

    const removedUndefined = pickBy(systemDesign, item => typeof item !== 'undefined');
    await foundSystemDesign.updateOne(removedUndefined);

    return OperationResult.ok(new SystemDesignDto({ ...foundSystemDesign.toObject(), ...removedUndefined } as any));
  }

  async delete(id: string, opportunityId: string): Promise<OperationResult<string>> {
    const systemDesign = await this.systemDesignModel.findOne({ _id: id, opportunity_id: opportunityId });
    if (!systemDesign) {
      throw ApplicationException.EnitityNotFound(id);
    }
    await systemDesign.deleteOne();
    return OperationResult.ok('Deleted Successfully');
  }

  async getAllSystemDesigns(
    limit: number,
    skip: number,
    selected: string,
    opportunityId: string,
  ): Promise<OperationResult<Pagination<SystemDesignDto>>> {
    let query: any;
    switch (selected) {
      case undefined:
      case '-1':
        query = this.systemDesignModel.find({ opportunity_id: opportunityId }).limit(limit).skip(skip).exec();
        break;
      case '0':
        query = this.systemDesignModel
          .find({ is_selected: false, opportunity_id: opportunityId })
          .limit(limit)
          .skip(skip)
          .exec();
        break;
      case '1':
        query = this.systemDesignModel
          .find({ is_selected: true, opportunity_id: opportunityId })
          .limit(limit)
          .skip(skip)
          .exec();
        break;
      default:
        query = this.systemDesignModel.find({ opportunity_id: opportunityId }).limit(limit).skip(skip).exec();
        break;
    }

    const [systemDesigns, total] = await Promise.all([query, this.systemDesignModel.estimatedDocumentCount()]);
    const data = (systemDesigns || []).map(item => new SystemDesignDto(item.toObject()));
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

  //  ->>>>>>>>> INTERNAL <<<<<<<<<-
  async getOneById(id: string): Promise<SystemDesign> {
    const systemDesign = await this.systemDesignModel.findById(id);
    return systemDesign.toObject();
  }

  async updateListSystemDesign(opportunityId: string, annualUsageKWh: number): Promise<boolean> {
    const systemDesigns = await this.systemDesignModel.find({ opportunity_id: opportunityId });
    await Promise.all(
      systemDesigns.map(item => {
        item.system_production_data.annual_usageKWh = annualUsageKWh;
        item.system_production_data.offset_percentage =
          annualUsageKWh > 0 ? item.system_production_data.generationKWh / annualUsageKWh : 0;
        return item.updateOne(item.toObject());
      }),
    );

    return true;
  }
}
