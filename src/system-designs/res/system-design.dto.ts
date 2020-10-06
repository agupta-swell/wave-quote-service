import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from '../../app/common';
import { toCamelCase } from '../../utils/transformProperties';
import { SystemDesign } from '../system-design.schema';
import { ServiceResponse } from './../../app/common/service-response';
import { IRoofTopSchema, ISystemProductionSchema } from './../system-design.schema';
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

  @ApiProperty()
  isSelected: boolean;

  constructor(props: SystemDesign) {
    this.id = props._id;
    this.opportunityId = props.opportunity_id;
    this.designMode = props.design_mode;
    this.name = props.name;
    this.latitude = props.latitude;
    this.longtitude = props.longtitude;
    this.thumbnail = props.thumbnail;
    this.isSelected = props.is_selected;
    this.systemProductionData = this.transformSystemProductionData(props.system_production_data);
    this.roofTopDesignData = this.transformRoofTopData(props.roof_top_design_data);
    this.capacityProductionDesignData = (null ||
      this.transformCapacityProductionData(props.capacity_production_design_data || '')) as any;
  }

  transformRoofTopData = (data: IRoofTopSchema): RoofTopDataDto => {
    const { panel_array, inverters, storage, adders } = data;

    return {
      panelArray: panel_array.map(item => {
        const {
          panel_model_data_snapshot: { name, part_number, price, sizeW, sizekWh, dimension, type },
        } = item;

        return {
          ...toCamelCase(item),
          panelModelDataSnapshot: { name, partNumber: part_number, price, sizeW, sizekWh, dimension, type },
        };
      }),
      inverters: inverters.map(item => {
        const {
          inverter_model_data_snapshot: { name, part_number, price, sizeW, sizekWh, dimension, type },
        } = item;

        return {
          ...toCamelCase(item),
          inverterModelDataSnapshot: { name, partNumber: part_number, price, sizeW, sizekWh, dimension, type },
        };
      }),
      storage: storage.map(item => {
        const {
          storage_model_data_snapshot: { name, part_number, price, sizeW, sizekWh, dimension, type },
        } = item;

        return {
          ...toCamelCase(item),
          storageModelDataSnapshot: { name, partNumber: part_number, price, sizeW, sizekWh, dimension, type },
        };
      }),
      adders: adders.map(item => toCamelCase(item)),
    };
  };

  transformSystemProductionData = (systemProduction: ISystemProductionSchema): SystemProductionDto => {
    return {
      capacityKW: systemProduction?.capacityKW || 0,
      generationKWh: systemProduction?.generationKWh || 0,
      productivity: systemProduction?.productivity || 0,
      annualUsageKWh: systemProduction?.annual_usageKWh || 0,
      offsetPercentage: systemProduction?.offset_percentage || 0,
    };
  };

  transformCapacityProductionData = (data: any): CapacityProductionDataDto => {
    // TODO: will implement when data is ready
    return null;
  };
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
