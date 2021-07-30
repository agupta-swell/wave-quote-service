import { Pagination, ServiceResponse } from 'src/app/common';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

class SectionDto {
  @ExposeMongoId({ eitherId: true })
  id: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  componentName: string;
}

class ProposalSectionMasterDto {
  @ExposeMongoId({ eitherId: true })
  id: string;

  @ExposeProp({ type: String, isArray: true })
  applicableFinancialProduct: string[];

  @ExposeProp({ type: String, isArray: true })
  applicableProducts: string[];
}

export class ProposalTemplateDto {
  @ExposeMongoId({ eitherId: true })
  id: string;

  @ExposeProp()
  name: string;

  @ExposeProp({ type: SectionDto, isArray: true })
  sections: SectionDto[];

  @ExposeProp({ type: ProposalSectionMasterDto })
  proposalSectionMaster: ProposalSectionMasterDto;
}

class ProposalTemplatePaginationRes implements Pagination<ProposalTemplateDto> {
  @ExposeProp({
    type: ProposalTemplateDto,
    isArray: true,
  })
  data: ProposalTemplateDto[];

  @ExposeProp()
  total: number;
}

export class ProposalTemplateListRes implements ServiceResponse<ProposalTemplatePaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ProposalTemplatePaginationRes })
  data: ProposalTemplatePaginationRes;
}

export class ProposalTemplateRes implements ServiceResponse<ProposalTemplateDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ProposalTemplateDto })
  data: ProposalTemplateDto;
}
