import { Pagination, ServiceResponse } from 'src/app/common';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class ProposalSectionMasterDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  applicableFundingSources: string[];

  @ExposeProp()
  applicableQuoteTypes: string[];

  @ExposeProp()
  componentName: string;
}

class ProposalSectionMasterPaginationRes implements Pagination<ProposalSectionMasterDto> {
  @ExposeProp({
    type: ProposalSectionMasterDto,
    isArray: true,
  })
  data: ProposalSectionMasterDto[];

  @ExposeProp()
  total: number;
}

export class ProposalSectionMasterListRes implements ServiceResponse<ProposalSectionMasterPaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ProposalSectionMasterPaginationRes })
  data: ProposalSectionMasterPaginationRes;
}

export class ProposalSectionMasterRes implements ServiceResponse<ProposalSectionMasterDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ProposalSectionMasterDto })
  data: ProposalSectionMasterDto;
}
