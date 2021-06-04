import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsJWT, IsNumber, IsString, Min, ValidateNested } from 'class-validator';

export class CustomerInformationDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  houseNumber: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  zipCode: number;
}

export class ValidateProposalDto {
  @ApiProperty()
  @IsJWT()
  token: string;

  @ApiProperty()
  @Type(() => CustomerInformationDto)
  @ValidateNested()
  customerInformation: CustomerInformationDto;
}
