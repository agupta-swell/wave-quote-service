import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetAllProposalSectionsMasterQuery {
  @ApiProperty({ required: false, type: Number })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => {
    return +value || 100;
  })
  limit = 100;

  @ApiProperty({ required: false, type: Number })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => +value || 0)
  skip = 0;

  @ApiProperty({ type: String, name: 'funding-sources' })
  @Expose({
    name: 'funding-sources',
  })
  @IsString({ each: true })
  @Transform(({ value }) => (value ? value.split(',') : []))
  fundingSources: string[];

  @ApiProperty({ type: String, name: 'quote-types' })
  @Expose({
    name: 'quote-types',
  })
  @IsString({ each: true })
  @Transform(({ value }) => (value ? value.split(',') : []))
  quoteTypes: string[];
}
