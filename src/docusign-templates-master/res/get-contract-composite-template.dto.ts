import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { SignerRoleMaster } from '../schemas';
import { DocusignCompositeTemplateMasterDataResDto, SignerRoleDataResDto, TemplateMasterDataResDto } from './sub-dto';

class TemplateDetailResDto {
  @ApiProperty({ type: TemplateMasterDataResDto })
  templateDetail: TemplateMasterDataResDto;

  @ApiProperty({ type: SignerRoleDataResDto, isArray: true })
  signerRoleDetails: SignerRoleDataResDto[];
}

class CompositeTemplateResDto {
  @ApiProperty({ type: TemplateDetailResDto, isArray: true })
  templateDetails: TemplateDetailResDto[];

  @ApiProperty({ type: DocusignCompositeTemplateMasterDataResDto })
  compositeTemplateData: DocusignCompositeTemplateMasterDataResDto;
}

export class GetContractCompositeTemplateDto {
  @ApiProperty({ type: CompositeTemplateResDto, isArray: true })
  compositeTemplates: CompositeTemplateResDto[];

  constructor(props: SignerRoleMaster[]) {
    this.compositeTemplates = [];
  }
}

export class GetContractCompositeTemplateRes implements ServiceResponse<GetContractCompositeTemplateDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetContractCompositeTemplateDto })
  data: GetContractCompositeTemplateDto;
}
