import { ApiProperty } from '@nestjs/swagger';
import { toCamelCase } from '../../utils/transformProperties';
import { Quoting } from '../quoting.schema';

class LatLng {
  @ApiProperty()
  lat: Number;

  @ApiProperty()
  lng: Number;
}

class PolygonDto {
  @ApiProperty()
  side: number;

  @ApiProperty()
  azimuth: number;

  @ApiProperty()
  polygon: [LatLng];

  @ApiProperty()
  panel: any;

  @ApiProperty()
  panelId: any;

  @ApiProperty()
  totalPanels: number;

  @ApiProperty()
  panels: [LatLng][];
}

export class QuotingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ isArray: true, type: PolygonDto })
  polygons: PolygonDto[];

  @ApiProperty()
  location: {
    address: string;
    latlng: LatLng;
  };

  constructor(props: Quoting) {
    this.id = props._id;
    this.name = props.name;
    this.location = props.location;
    this.polygons = props.polygons.map(polygon => toCamelCase(polygon));
  }

  static quotingListDto(props: Quoting) {
    const quoting = new QuotingDto(props);
    return {
      id: quoting.id,
      name: quoting.name,
    };
  }
}
