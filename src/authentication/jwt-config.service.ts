import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import * as AWS from 'aws-sdk';

export class JwtConfigService implements JwtOptionsFactory {
  client: AWS.SecretsManager;

  static appSecret: string;

  constructor() {
    this.client = new AWS.SecretsManager({
      region: process.env.AWS_REGION,
    });
  }

  async createJwtOptions(): Promise<JwtModuleOptions> {
    const appSecret = process.env.JWT_SECRET;

    if (!appSecret) {
      throw new Error('Missing JWT_SECRET env');
    }

    JwtConfigService.appSecret = appSecret;
    return {
      secret: appSecret,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRE_TIME,
      },
    };
  }
}
