import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';

export class GetHomeownersByIdResultResDto {
  @ExposeProp()
  contactId: string;

  @ExposeProp()
  isPrimary: boolean;
}

export class GetHomeownersByIdResDto implements ServiceResponse<GetHomeownersByIdResultResDto[]> {
  @ExposeProp()
  status: string;

  @ExposeProp()
  data: GetHomeownersByIdResultResDto[];
}
