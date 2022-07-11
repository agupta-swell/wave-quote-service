import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class GetOppExistingSystemsQuery {
  @ApiProperty()
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => {
    if (value) {
      const n = +value;

      return n > 25 ? 25 : n;
    }
    return undefined;
  })
  limit?: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => +value)
  skip?: number;
}
