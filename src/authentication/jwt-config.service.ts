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
    const appSecret = await this.getJWTSecretKey();
    JwtConfigService.appSecret = appSecret;
    return {
      secret: appSecret,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRE_TIME,
      },
    };
  }

  async getJWTSecretKey(): Promise<string> {
    let secret: string, decodedBinarySecret: string;
    try {
      const data = await this.client.getSecretValue({ SecretId: process.env.SOLAR_QUOTING_TOOL_INTEGRATION }).promise();
      if ('SecretString' in data) {
        secret = data.SecretString;
      } else {
        let buff = Buffer.from(data.SecretBinary.toString(), 'base64');
        decodedBinarySecret = buff.toString('ascii');
      }
    } catch (error) {
      console.error('>>>>>>>>>>>>>>>>>>>', 'JwtConfigService -> decode secret error', error);
    }

    return JSON.parse(secret ? secret : decodedBinarySecret)?.JWT_SECRET as string;
  }
}
