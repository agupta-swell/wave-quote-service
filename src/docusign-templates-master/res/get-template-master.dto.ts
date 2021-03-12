import { ApiProperty } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { ServiceResponse } from 'src/app/common';
import { toCamelCase } from '../../utils/transformProperties';
import { DocusignTemplateMaster } from '../docusign-template-master.schema';
import { TemplateMasterDataResDto } from './sub-dto';

export class GetTemplateMasterDto {
  @ApiProperty({ type: TemplateMasterDataResDto, isArray: true })
  templateMasters: TemplateMasterDataResDto[];

  constructor(props: LeanDocument<DocusignTemplateMaster>[]) {
    this.templateMasters = props?.map(item => ({
      ...toCamelCase(item),
      recipientRoles: item.recipient_roles.map(role => toCamelCase(role)),
    }));
  }
}

export class GetTemplateMasterRes implements ServiceResponse<GetTemplateMasterDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetTemplateMasterDto })
  data: GetTemplateMasterDto;
}
