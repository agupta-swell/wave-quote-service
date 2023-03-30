import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DocusignIntegrationReqDto {
  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  rsaPrivateKey: string;

  @ApiProperty()
  @IsString()
  redirectUri: string;
}
