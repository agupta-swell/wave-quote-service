import { ApiProperty } from '@nestjs/swagger';
import { UtilityMaster } from 'src/docusign-templates-master/schemas';

export class UtilityMasterResDto {
  @ApiProperty()
  utility_name: string;

  @ApiProperty()
  lse_id: string;

  constructor(props: UtilityMaster) {
    this.lse_id = props.lse_id;
    this.utility_name = props.utility_name;
  }
}
