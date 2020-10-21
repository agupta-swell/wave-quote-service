import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';

export class ProgressDto {
  @ApiProperty()
  utilityAndUsageCounter: number;

  @ApiProperty()
  systemDesignCounter: number;

  @ApiProperty()
  quoteCounter: number;

  constructor(props: any) {
    this.utilityAndUsageCounter = props.utilityAndUsageCounter;
    this.systemDesignCounter = props.systemDesignCounter;
    this.quoteCounter = props.quoteCounter;
  }
}

export class ProgressRes implements ServiceResponse<ProgressDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ProgressDto })
  data: ProgressDto;
}
