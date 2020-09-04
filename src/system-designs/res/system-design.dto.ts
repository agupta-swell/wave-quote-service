import { ApiProperty } from '@nestjs/swagger';
import { toCamelCase } from '../../utils/transformProperties';
import { SystemDesign } from '../system-design.schema';
import { IRoofTopSchema } from './../system-design.schema';
import { CapacityProductionDataDto } from './capacity-production.dto';
import { RoofTopDataDto } from './roof-top-data.dto';

export class LatLng {
  @ApiProperty()
  lat: Number;

  @ApiProperty()
  lng: Number;
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

  @ApiProperty()
  roofTopDesignData: RoofTopDataDto;

  @ApiProperty()
  capacityProductionDesignData: CapacityProductionDataDto;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longtitude: number;

  constructor(props: SystemDesign) {
    this.id = props._id;
    this.opportunityId = props.opportunity_id;
    this.designMode = props.design_mode;
    this.name = props.name;
    this.latitude = props.latitude;
    this.longtitude = props.longtitude;
    this.roofTopDesignData = this.transformRoofTopData(props.roof_top_design_data);
    this.capacityProductionDesignData = (null ||
      this.transformCapacityProductionData(props.capacity_production_design_data || '')) as any;
  }

  transformRoofTopData = (data: IRoofTopSchema): RoofTopDataDto => {
    const { panel_array, inverters, storage } = data;

    return {
      panelArray: panel_array.map(item => toCamelCase(item)),
      inverters: inverters.map(item => toCamelCase(item)),
      storage: storage.map(item => toCamelCase(item)),
    };
  };

  transformCapacityProductionData = (data: any): CapacityProductionDataDto => {
    // TODO: will implement when data is ready
    return null;
  };
}
