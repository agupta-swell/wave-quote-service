import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { Pagination } from 'src/app/common';
import { ServiceResponse } from 'src/app/common/service-response';
import { toCamelCase } from 'src/utils/transformProperties';
import {
  IInverterProductSchema,
  IPanelProductSchema,
  IRoofTopSchema,
  IStorageProductSchema,
  ISystemProductionSchema,
  SystemDesign,
} from '../system-design.schema';
import { CapacityProductionDataDto, RoofTopDataDto } from './sub-dto';

export class SystemProductionDto {
  @ApiProperty()
  capacityKW: number;

  @ApiProperty()
  generationKWh: number;

  @ApiProperty()
  productivity: number;

  @ApiProperty()
  annualUsageKWh: number;

  @ApiProperty()
  offsetPercentage: number;

  @ApiProperty()
  generationMonthlyKWh: number[];
}

export class SystemDesignDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  designMode: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: RoofTopDataDto })
  roofTopDesignData: RoofTopDataDto;

  @ApiProperty({ type: CapacityProductionDataDto })
  capacityProductionDesignData: CapacityProductionDataDto;

  @ApiProperty({ type: SystemProductionDto })
  systemProductionData: SystemProductionDto;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longtitude: number;

  @ApiProperty()
  thumbnail: string;

  // @ApiProperty()
  // isSelected: boolean;

  @ApiProperty()
  isRetrofit: boolean;

  @ApiProperty()
  isSolar: boolean;

  constructor(props: LeanDocument<SystemDesign>) {
    this.id = props._id;
    this.opportunityId = props.opportunity_id;
    this.designMode = props.design_mode;
    this.name = props.name;
    this.latitude = props.latitude;
    this.longtitude = props.longtitude;
    this.thumbnail = props.thumbnail;
    // this.isSelected = props.is_selected;
    this.isSolar = props.is_solar;
    this.isRetrofit = props.is_retrofit;
    this.systemProductionData = this.transformSystemProductionData(props.system_production_data);
    this.roofTopDesignData = this.transformRoofTopData(props.roof_top_design_data);
    this.capacityProductionDesignData = (null ||
      this.transformCapacityProductionData(props.capacity_production_design_data || '')) as any;
  }

  transformRoofTopData = (data: IRoofTopSchema): RoofTopDataDto => {
    if (!data) return {} as any;
    const { panel_array, inverters, storage, adders, ancillary_equipments, balance_of_systems } = data;

    const getProductCommon = (item: IPanelProductSchema | IInverterProductSchema | IStorageProductSchema) => ({
      manufacturerId: item.manufacturer_id,
      name: item.name,
      partNumber: item.part_number,
      price: item.price,
      sizeW: item.sizeW,
      sizekWh: item.sizekWh,
      dimension: item.dimension,
      type: item.type,
      modelName: item.model_name,
      approvedForEsa: item.approved_for_esa,
      approvedForGsa: item.approved_for_gsa,
    });

    return {
      panelArray: panel_array.map(item => {
        const {
          panel_model_data_snapshot: { watt_class_stcdc, panel_output_mode, pv_watt_module_type },
        } = item;

        return {
          ...toCamelCase(item),
          panelModelDataSnapshot: {
            ...getProductCommon(item.panel_model_data_snapshot),
            wattClassStcdc: watt_class_stcdc,
            panelOutputMode: panel_output_mode,
            pvWattModuleType: pv_watt_module_type,
          },
        };
      }),
      inverters: inverters.map(item => {
        const {
          inverter_model_data_snapshot: { inverter_type },
        } = item;

        return {
          ...toCamelCase(item),
          inverterModelDataSnapshot: {
            ...getProductCommon(item.inverter_model_data_snapshot),
            inverterType: inverter_type,
          },
        };
      }),
      storage: storage.map(item => {
        const {
          storage_model_data_snapshot: { battery_type },
        } = item;

        return {
          ...toCamelCase(item),
          storageModelDataSnapshot: {
            ...getProductCommon(item.storage_model_data_snapshot),
            batteryType: battery_type,
          },
        };
      }),
      adders: adders.map(item => toCamelCase(item)),
      ancillaryEquipments: (ancillary_equipments || []).map(item => {
        const {
          ancillary_equipment_model_data_snapshot: {
            manufacturer_id,
            model_name,
            related_component,
            description,
            quantity,
          },
        } = item;

        return {
          ...toCamelCase(item),
          ancillaryEquipmentModelDataSnapshot: {
            manufacturerId: manufacturer_id,
            modelName: model_name,
            relatedComponent: related_component,
            description,
            quantity,
          },
        };
      }),
      balanceOfSystems: (balance_of_systems || []).map(item => toCamelCase(item)),
    };
  };

  transformSystemProductionData = (systemProduction: ISystemProductionSchema): SystemProductionDto => ({
    capacityKW: systemProduction?.capacityKW || 0,
    generationKWh: systemProduction?.generationKWh || 0,
    productivity: systemProduction?.productivity || 0,
    annualUsageKWh: systemProduction?.annual_usageKWh || 0,
    offsetPercentage: systemProduction?.offset_percentage || 0,
    generationMonthlyKWh: systemProduction?.generationMonthlyKWh || [],
  });

  transformCapacityProductionData = (data: any): CapacityProductionDataDto => null as any;
}

class SystemDesignPaginationRes implements Pagination<SystemDesignDto> {
  @ApiProperty({
    type: SystemDesignDto,
    isArray: true,
  })
  data: SystemDesignDto[];

  @ApiProperty()
  total: number;
}

export class SystemDesignListRes implements ServiceResponse<SystemDesignPaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: SystemDesignPaginationRes })
  data: SystemDesignPaginationRes;
}

export class SystemDesignRes implements ServiceResponse<SystemDesignDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: SystemDesignDto })
  data: SystemDesignDto;
}
