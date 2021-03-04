import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';

export class GenerateTokenRes implements ServiceResponse<{ token: string }> {
  @ApiProperty()
  status: string;

  @ApiProperty()
  data: { token: string };
}
