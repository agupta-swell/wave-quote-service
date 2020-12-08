import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { IFniUpdateReq, IUpdateSightenRequest, IUpdateSightenResponse } from './../typing.d';
import { FniEngineService } from './fni-engine.service';

// FIXME: delete after deploying production
@Injectable()
export class FniCallbackService {
  constructor(
    @Inject(forwardRef(() => FniEngineService))
    private fniEngineService: FniEngineService,
  ) {}

  async updateSighten(req: IUpdateSightenRequest) {
    const { userName, password } = await this.fniEngineService.getSecretFNIInformation();

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
    } else {
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
  }
}
