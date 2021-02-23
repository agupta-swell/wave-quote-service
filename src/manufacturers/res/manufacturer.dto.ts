import { ApiProperty } from "@nestjs/swagger";

export class ManufacturerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  constructor(props: any) {
    this.id = props._id;
    this.name = props.name;
  }
}