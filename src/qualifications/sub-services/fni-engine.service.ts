import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as AWS from 'aws-sdk';
import { Model } from 'mongoose';
import axios, { AxiosInstance } from 'axios';
import { EHttpMethod, EVendor } from 'src/shared/api-metrics/api-metrics.schema';
import { ApiMetricsService } from 'src/shared/api-metrics/api-metrics.service';
import { ApplicationException } from 'src/app/app.exception';
import { ExternalService } from '../../external-services/external-service.service';
import { FNI_APPLICATION_STATE, FNI_REQUEST_TYPE, FNI_TRANSACTION_STATUS } from '../constants';
import {
  IFniApplyReq,
  IFniProcessReq,
  IFniResponse,
  IFniResponseData,
  IFniSolarInitCoAppReqPayload,
  IFniSolarInitReqPayload,
} from '../typing.d';
import { ProcessCreditQualificationReqDto } from '../req/process-credit-qualification.dto';
import { IFniApplication, QUALIFICATION_CREDIT, QualificationCredit } from '../qualification.schema';

@Injectable()
export class FniEngineService {
  AWS_REGION: string;

  client: AWS.SecretsManager;

  private readonly fniClient: AxiosInstance;

  private readonly fniEndpoint: string;

  constructor(
    private readonly externalService: ExternalService,
    @InjectModel(QUALIFICATION_CREDIT) private readonly qualificationCreditModel: Model<QualificationCredit>,
    private readonly apiMetricsService: ApiMetricsService,
  ) {
    const { AWS_REGION } = process.env;

    this.client = new AWS.SecretsManager({
      region: AWS_REGION,
    });

    if (!process.env.FNI_END_POINT) {
      throw new Error('Missing FNI_END_POINT');
    }

    this.fniEndpoint = process.env.FNI_END_POINT;

    this.fniClient = axios.create({
      baseURL: this.fniEndpoint,
    });
  }

  async processFniSolarApplyRequest(req: ProcessCreditQualificationReqDto): Promise<IFniResponse> {
    const { FNI_API_KEY, FNI_API_HASH, FNI_PARTNER_ID } = process.env;
    const reqPayload: IFniProcessReq = {
      transaction: {
        key: FNI_API_KEY || '',
        hash: FNI_API_HASH || '',
        partnerId: FNI_PARTNER_ID || '',
        refnum: req.refnum,
      },
    };
    const fniResponse = await this.callFniAPI<any, IFniProcessReq>({
      url: FNI_REQUEST_TYPE.SOLAR_APPLY,
      method: EHttpMethod.POST,
      data: reqPayload,
    });

    return fniResponse;
  }

  // NOTE: NEVER NEVER NEVER NEVER store the fniApplyRequestParam or applyRequestInst in the database
  // NOTE: NEVER NEVER NEVER NEVER log the fniApplyRequestParam or applyRequestInst
  // NOTE: Copy this warning and paste it in the code at the top and bottom of this method

  async applyPrimaryApplicant(req: IFniApplyReq): Promise<IFniResponse> {
    const reqPayload: IFniSolarInitReqPayload = {
      transaction: {
        key: process.env.FNI_API_KEY || '',
        hash: process.env.FNI_API_HASH || '',
        partnerId: process.env.FNI_PARTNER_ID || '',
      },
      application: {
        externalTrackingNum: req.opportunityId,
        productId: req.productId,
        requestCrline: '50000', // hardcode for now, FNI will be removing the requirement for this field
      },
      applicant1: {
        first: req.applicant.firstName,
        mi: req.applicant.middleName,
        last: req.applicant.lastName,
        soc: req.applicantSecuredData.soc.toString(),
        dob: req.applicantSecuredData.dob.toString(),
        addr: req.primaryResidence.addressLine1,
        attn: req.primaryResidence.addressLine2,
        city: req.primaryResidence.city,
        state: req.primaryResidence.state,
        zip: req.primaryResidence.zipcode,
        eMail: req.applicant.email,
        phone: req.applicant.phoneNumber,
        propAddr: req.installationAddress.addressLine1,
        propAttn: req.installationAddress.addressLine2,
        propCity: req.installationAddress.city,
        propState: req.installationAddress.state,
        propZip: req.installationAddress.zipcode,
      },
      employment: [
        {
          empChnum: '1',
          empPay: req.applicantSecuredData.individualIncome,
          empPayBasis: req.applicantSecuredData.incomeFrequency,
          empType: 'CURRENT',
        },
      ],
    };

    const fniResponse = await this.callFniAPI<any, IFniSolarInitReqPayload>({
      url: FNI_REQUEST_TYPE.SOLAR_INIT,
      method: EHttpMethod.POST,
      data: reqPayload,
    });

    return fniResponse;
  }

  async applyCoApplicant(req: IFniApplyReq): Promise<IFniResponse> {
    const reqPayload: IFniSolarInitCoAppReqPayload = {
      transaction: {
        key: process.env.FNI_API_KEY || '',
        hash: process.env.FNI_API_HASH || '',
        partnerId: process.env.FNI_PARTNER_ID || '',
        refnum: String(req.refnum),
      },
      applicant2: {
        first: req.applicant.firstName,
        mi: req.applicant.middleName,
        last: req.applicant.lastName,
        soc: req.applicantSecuredData.soc.toString(),
        dob: req.applicantSecuredData.dob.toString(),
        addr: req.primaryResidence.addressLine1,
        city: req.primaryResidence.city,
        state: req.primaryResidence.state,
        zip: req.primaryResidence.zipcode,
        eMail: req.applicant.email,
        phone: req.applicant.phoneNumber,
        propAddr: req.installationAddress.addressLine1,
        propCity: req.installationAddress.city,
        propState: req.installationAddress.state,
        propZip: req.installationAddress.zipcode,
      },
      employment: [
        {
          empChnum: '2',
          empPay: req.applicantSecuredData.individualIncome,
          empPayBasis: req.applicantSecuredData.incomeFrequency,
          empType: 'CURRENT',
        },
      ],
    };

    const fniResponse = await this.callFniAPI<any, IFniSolarInitCoAppReqPayload>({
      url: FNI_REQUEST_TYPE.SOLAR_INITCOAPP,
      method: EHttpMethod.POST,
      data: reqPayload,
    });

    return fniResponse;
  }

  // async update(req: IFniUpdateReq): Promise<IFniUpdateRes> {
  //   let coinedErrorMessage = '';
  //   let fniCommunication = await this.fniCommunicationModel.findById(req.fniCommunicationId);

  //   if (!fniCommunication) {
  //     coinedErrorMessage = `FNI Communication Id: ${req.fniCommunicationId} not found !!!`;

  //     const now = new Date();
  //     fniCommunication = new this.fniCommunicationModel({
  //       qualificationCreditId: req.qualificationCreditId,
  //       receivedOn: now,
  //       sentOn: now,
  //       vendorRefId: req.vendorRefId,
  //       requestCategory: REQUEST_CATEGORY.CREDIT,
  //       requestType: REQUEST_TYPE.INBOUND,
  //       responseStatus: 'FAILURE IN WAVE',
  //       responseCode: req.code,
  //       rawDataFromFni: req.rawRequest,
  //     });

  //     await fniCommunication.save();
  //   } else {
  //     fniCommunication.rawDataFromFni = req.rawRequest;
  //   }

  //   if (fniCommunication.vendorRefId !== req.vendorRefId) {
  //     coinedErrorMessage = `${coinedErrorMessage} - VendorId: ${req.vendorRefId} not found !!!`;
  //   }

  //   if (fniCommunication.qualificationCreditId !== req.qualificationCreditId) {
  //     coinedErrorMessage = `${coinedErrorMessage} - Credit Qualification Id: ${req.qualificationCreditId} not found !!!`;
  //   }

  //   const qualificationCredit = await this.qualificationService.getOneById(fniCommunication.qualificationCreditId);
  //   if (!qualificationCredit) {
  //     coinedErrorMessage = `${coinedErrorMessage} - Credit Qualification Id: ${req.qualificationCreditId} not found !!!`;
  //   }

  //   const res = {} as IFniUpdateRes;

  //   if (coinedErrorMessage.length > 0) {
  //     coinedErrorMessage = `ERROR: ${coinedErrorMessage}`;
  //     res.refNum = req.vendorRefId;
  //     res.status = 'ERROR';
  //     res.errorMsgs = [{ fieldId: null as any, errorType: 'GENERAL', message: coinedErrorMessage }];

  //     fniCommunication.errorMessageSentToFni.unshift(JSON.stringify(res));

  //     await fniCommunication.save();

  //     return res;
  //   }

  //   const fniResponseCode = this.translateFniResponseCode(req.code);
  //   try {
  //     this.qualificationService.handleFNIResponse(
  //       fniResponseCode,
  //       'System - FNI Triggered',
  //       qualificationCredit as any,
  //     );
  //     res.refNum = req.vendorRefId;
  //     res.status = 'SUCCESS';
  //     fniCommunication.errorMessageSentToFni.unshift(JSON.stringify(res));
  //   } catch (error) {
  //     res.refNum = req.vendorRefId;
  //     res.status = 'ERROR';
  //     res.errorMsgs = [{ fieldId: null as any, errorType: 'GENERAL', message: 'System Error' }];
  //     fniCommunication.errorMessageSentToFni.unshift(JSON.stringify(res));
  //   }

  //   await fniCommunication.save();

  //   return res;
  // }

  getSecretManager = (secretName: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const { AWS_REGION } = process.env;
      const client = new AWS.SecretsManager({ region: AWS_REGION });
      let returnValue: string;
      client.getSecretValue({ SecretId: secretName }, (err, data) => {
        if (err) {
          console.log('error getSecretManager:fni-engine.service.ts::', err);
          return reject(err);
        }

        if ('SecretString' in data) {
          returnValue = data.SecretString as string;
        } else {
          returnValue = Buffer.from(data.SecretBinary as any, 'base64').toString('ascii');
        }

        return resolve(returnValue);
      });
    });

  // ======================= INTERNAL ========================

  translateFniResponseCode(code: string): string {
    switch (code) {
      case 'A':
      case 'X':
        return 'SUCCESS';
      case 'D':
      case 'C':
      case 'Y':
        return 'FAILURE';
      default:
        return 'PENDING';
    }
  }

  async callFniAPI<U, K>(requestData: {
    url: FNI_REQUEST_TYPE;
    method: EHttpMethod;
    params?: U;
    data?: K;
  }): Promise<IFniResponse> {
    let status = 500;
    let data;
    try {
      const response = await this.fniClient.request<IFniResponseData>(requestData);
      status = response.status;
      data = response.data;
    } catch (e) {
      status = e.response.status;
    }

    const route = `${this.fniEndpoint}/${requestData.url}`;

    await this.apiMetricsService.updateAPIMetrics({
      vendor: EVendor.FNI,
      method: requestData.method,
      route,
    });

    return {
      type: requestData.url,
      status,
      data,
    };
  }
}
