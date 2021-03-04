import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { IFniUpdateReq, IUpdateSightenRequest, IUpdateSightenResponse } from '../typing.d';
import { FniEngineService } from './fni-engine.service';

// FIXME: delete after deploying production
@Injectable()
export class FniCallbackService {
  AWS_REGION: string;

  client: AWS.SecretsManager;

  constructor(private readonly fniEngineService: FniEngineService) {
    const { AWS_REGION } = process.env;

    this.client = new AWS.SecretsManager({
      region: AWS_REGION,
    });
  }

  async updateSighten(req: IUpdateSightenRequest) {
    const { userName, password } = await this.getSecretFNIInformation();

    if (userName === req.transaction.username && password === req.transaction.password) {
      const request = {
        vendorRefId: req.transaction.refNum,
        fniCommunicationId: req.application.track,
        code: req.application.code,
        qualificationCreditId: req.applicant1.sightenId,
        rawRequest: JSON.stringify(req),
      } as IFniUpdateReq;

      const res = await this.fniEngineService.update(request);
      const response = {
        transaction: {
          ...res,
        },
      } as IUpdateSightenResponse;

      return response;
    }
    const response = {
      transaction: {
        refNum: req.transaction.refNum,
        status: 'ERROR',
        errorMsgs: [
          {
            errorType: 'GENERAL',
            message: 'Authentication Failure',
          },
        ],
      },
    } as IUpdateSightenResponse;

    return response;
  }

  async getSecretFNIInformation() {
    let secret = '';
    let decodedBinarySecret = '';

    try {
      const data = await this.client.getSecretValue({ SecretId: 'fniAPISecret-cpxGGmSQW6jO' }).promise();
      if ('SecretString' in data) {
        secret = data.SecretString || '';
      } else {
        const buff = Buffer.from((data.SecretBinary || '').toString(), 'base64');
        decodedBinarySecret = buff.toString('ascii');
      }
    } catch (error) {
      console.log('>>>>>>>>>>>>>>>>>>>', 'FniEngineService -> decode secret', error);
    }

    // FIXME: need to delete later
    return {
      userName: 'thanghq',
      password: '1',
    };
  }
}
