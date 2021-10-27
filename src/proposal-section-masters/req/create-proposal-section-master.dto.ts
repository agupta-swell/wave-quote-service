import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateProposalSectionMasterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: String, isArray: true })
  @IsArray()
  @IsNotEmpty()
  applicableFundingSources: string[];

  @ApiProperty({ type: String, isArray: true })
  @IsArray()
  @IsNotEmpty()
  applicableQuoteTypes: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  componentName: string;
}
