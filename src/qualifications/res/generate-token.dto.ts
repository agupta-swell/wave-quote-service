import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';

export class GenerateTokenRes implements ServiceResponse<{ token: string }> {
  @ExposeProp()
  status: string;

  @ExposeProp()
  data: { token: string };
}
