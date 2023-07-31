import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { DOCUSIGN_INTEGRATION_TYPE } from '../constants';

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
  type: DOCUSIGN_INTEGRATION_TYPE;

  @ExposeProp()
  expiresAt: Date;
}
