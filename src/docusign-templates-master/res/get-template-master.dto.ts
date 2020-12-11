import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { DocusignTemplateMaster } from '../docusign-template-master.schema';
import { toCamelCase } from './../../utils/transformProperties';
import { TemplateMasterDataResDto } from './sub-dto';

export class GetTemplateMasterDto {
  @ApiProperty({ type: TemplateMasterDataResDto, isArray: true })
  templateMasters: TemplateMasterDataResDto[];

  constructor(props: DocusignTemplateMaster[]) {
    this.templateMasters = props?.map(item => toCamelCase(item));
  }
}

export class GetTemplateMasterRes implements ServiceResponse<GetTemplateMasterDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetTemplateMasterDto })
  data: GetTemplateMasterDto;
}
