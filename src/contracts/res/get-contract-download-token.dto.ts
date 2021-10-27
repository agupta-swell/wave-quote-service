import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';

export class GetContractDownloadTokenDto {
  @ExposeProp()
  filename: string;

  @ExposeProp()
  token: string;
}

export class GetContractDownloadTokenResDto implements ServiceResponse<GetContractDownloadTokenDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetContractDownloadTokenDto })
  data: GetContractDownloadTokenDto;
}
