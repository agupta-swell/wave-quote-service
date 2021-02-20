import { ApiProperty } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { SystemDesignAncillaryMaster } from '../schemas';

export class SystemDesignAncillaryMasterDto {
  @ApiProperty()
  manufacturer: string;

  @ApiProperty()
  modelName: string;

  @ApiProperty()
  relatedComponent: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  averageWholeSalePrice: number;

  @ApiProperty()
  applicableProductManufacturer: number;

  constructor(props: SystemDesignAncillaryMaster) {
    this.manufacturer = props.manufacturer;
    this.modelName = props.model_name;
    this.relatedComponent = props.related_component;
    this.description = props.description;
    this.averageWholeSalePrice = props.average_whole_sale_price;
    this.applicableProductManufacturer = props.applicable_product_manufacturer;
  }
}

class AnciallaryMasterPaginationRes implements Pagination<SystemDesignAncillaryMasterDto> {
  @ApiProperty({
    type: SystemDesignAncillaryMasterDto,
    isArray: true,
  })
  data: SystemDesignAncillaryMasterDto[];

  @ApiProperty()
  total: number;
}

export class SystemDesignAncillaryMasterListRes implements ServiceResponse<AnciallaryMasterPaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: AnciallaryMasterPaginationRes })
  data: AnciallaryMasterPaginationRes;
}
