import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PRIMARY_QUOTE_TYPE } from 'src/quotes/constants';

export class CreateProposalSectionMasterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: String, isArray: true })
  @IsArray()
  @IsNotEmpty()
  applicableFundingSources: string[];

  @ApiProperty({ enum: PRIMARY_QUOTE_TYPE, isArray: true })
  @IsArray()
  @IsEnum(PRIMARY_QUOTE_TYPE, { each: true })
  @IsNotEmpty()
  applicableQuoteTypes: PRIMARY_QUOTE_TYPE[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  componentName: string;
}
