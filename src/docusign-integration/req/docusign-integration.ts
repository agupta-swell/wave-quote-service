import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { DOCUSIGN_INTEGRATION_TYPE } from '../constants';

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

  @ApiProperty()
  @IsString()
  type: DOCUSIGN_INTEGRATION_TYPE;
}
