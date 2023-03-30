import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class DocusignIntegrationResDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  accessToken: string;

  @ExposeProp()
  clientId: string;

  @ExposeProp()
  userId: string;

  @ExposeProp()
  scopes: string[];

  @ExposeProp()
  rsaPrivateKey: string;

  @ExposeProp()
  redirectUri: string;

  @ExposeProp()
  expiresAt: Date;
}
