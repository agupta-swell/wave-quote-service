import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from '../../app/common';
import { Product } from '../product.schema';
import { ServiceResponse } from './../../app/common/service-response';

export class ProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  manufacturer: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  sizeW: number;

  @ApiProperty()
  sizekWh: number;

  @ApiProperty()
  partNumber: string[];

  @ApiProperty()
  dimension: {
    length: number;
    width: number;
  };

  @ApiProperty()
  modelName: string;

  @ApiProperty()
  approvedForGsa: boolean;

  @ApiProperty()
  approvedForEsa: boolean;

  @ApiProperty()
  pvWattModuleType: string;

  @ApiProperty()
  panelOutputMode: string;

  @ApiProperty()
  wattClassStcdc: number;

  @ApiProperty()
  inverterType: string;

  @ApiProperty()
  batteryType: string;

  @ApiProperty()
  relatedComponent: string;

  constructor(props: Product) {
    this.id = props.id;
    this.manufacturer = props.manufacturer;
    this.name = props.name;
    this.type = props.type;
    this.price = props.price;
    this.sizeW = props.sizeW;
    this.sizekWh = props.sizekWh;
    this.partNumber = props.partNumber;
    this.dimension = props.dimension;
    this.modelName = props.model_name;
    this.approvedForGsa = props.approved_for_gsa;
    this.approvedForEsa = props.approved_for_esa;
    // For Panel
    this.pvWattModuleType = props.pv_watt_module_type;
    this.panelOutputMode = props.panel_output_mode;
    this.wattClassStcdc = props.watt_class_stcdc;
    // For Inverter
    this.inverterType = props.inverter_type;
    // For Storage/Battery
    this.batteryType = props.battery_type;
    // For Balance of System
    this.relatedComponent = props.related_component;
  }
}

class ProductPaginationRes implements Pagination<ProductDto> {
  @ApiProperty({
    type: ProductDto,
    isArray: true,
  })
  data: ProductDto[];

  @ApiProperty()
  total: number;
}

export class ProductResponse implements ServiceResponse<ProductPaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ProductPaginationRes })
  data: ProductPaginationRes;
}
