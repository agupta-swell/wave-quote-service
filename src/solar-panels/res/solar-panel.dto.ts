import { ApiProperty } from '@nestjs/swagger';
import { SolarPanel } from '../solar-panel.schema';

export class SolarPanelDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  width: number;

  @ApiProperty()
  length: number;

  @ApiProperty()
  unit: string;

  constructor(props: SolarPanel) {
    this.id = props._id;
    this.name = props.name;
    this.width = props.width;
    this.length = props.length;
    this.unit = props.unit;
  }
}
