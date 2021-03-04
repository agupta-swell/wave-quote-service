import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as AWS from 'aws-sdk';
import { Model } from 'mongoose';
import { ExternalService } from '../../external-services/external-service.service';
import { REQUEST_CATEGORY, REQUEST_TYPE } from '../constants';
import { QualificationService } from '../qualification.service';
import { FNI_Communication, FNI_COMMUNICATION } from '../schemas/fni-communication.schema';
import { IApplyRequest, IFniApplyReq, IFniUpdateReq, IFniUpdateRes } from '../typing.d';

@Injectable()
export class FniEngineService {
  AWS_REGION: string;

  client: AWS.SecretsManager;

  constructor(
    @InjectModel(FNI_COMMUNICATION) private readonly fniCommunicationModel: Model<FNI_Communication>,
    private readonly externalService: ExternalService,
    @Inject(forwardRef(() => QualificationService))
    private qualificationService: QualificationService,
  ) {
    const { AWS_REGION } = process.env;

    this.client = new AWS.SecretsManager({
      region: AWS_REGION,
    });
  }

  // NOTE: NEVER NEVER NEVER NEVER store the fniApplyRequestParam or applyRequestInst in the database
  // NOTE: NEVER NEVER NEVER NEVER log the fniApplyRequestParam or applyRequestInst
  // NOTE: Copy this warning and paste it in the code at the top and bottom of this method

  async apply(req: IFniApplyReq): Promise<string> {
    const fniModel = new this.fniCommunicationModel({
      qualification_credit_id: req.qualificationCreditId,
      sent_on: new Date(),
      request_category: REQUEST_CATEGORY.CREDIT,
      request_type: REQUEST_TYPE.OUTBOUND,
    });
    const fniKey: any = JSON.parse(await this.getSecretManager(process.env.FNI_SECRET_MANAGER_NAME));
    await fniModel.save();
    const applyReq = {
      transaction: {
        // FIXME: need to change if Hari notify
        username: fniKey.fni.username,
        password: fniKey.fni.password,
        partnerId: fniKey.fni.partnerId,
      },
      application: {
        track: fniModel._id.toString(),
        waveId: req.opportunityId,
      },
      applicant1: {
        sightenId: req.qualificationCreditId.toString(),
        first: req.primaryApplicantData.firstName,
        mi: req.primaryApplicantData.middleName,
        last: req.primaryApplicantData.lastName,
        eMail: req.primaryApplicantData.email,
        phnum: req.primaryApplicantData.phoneNumber,
        primSmsFlag: 'Y',
        dob: req.primaryApplicantSecuredData.dob.toString(),
        soc: req.primaryApplicantSecuredData.soc.toString(),
        primAddr: req.primaryApplicantData.addressLine1,
        primAttn: req.primaryApplicantData.addressLine2,
        primCity: req.primaryApplicantData.city,
        primState: req.primaryApplicantData.state,
        primZip: req.primaryApplicantData.zipcode.toString(),
      },
      applicant2: {
        first: req.coApplicantData.firstName,
        mi: req.coApplicantData.middleName,
        sightenId: req.qualificationCreditId.toString(),
        last: req.coApplicantData.lastName,
        eMail: req.coApplicantData.email,
        phnum: req.coApplicantData.phoneNumber,
        primSmsFlag: 'Y',
        dob: req.coApplicantSecuredData.dob.toString(),
        soc: req.coApplicantSecuredData.soc.toString(),
        coAddr: req.coApplicantData.addressLine1,
        coAttn: req.coApplicantData.addressLine2,
        coCity: req.coApplicantData.city,
        coState: req.coApplicantData.state,
        coZip: req.coApplicantData.zipcode.toString(),
      },
    } as IApplyRequest;

    const applyResponse = await this.externalService.getFniResponse(applyReq);
    if (applyResponse.transaction.status === 'ERROR') {
      await this.fniCommunicationModel.updateOne(
        { _id: fniModel._id },
        {
          received_on: new Date(),
          vendor_ref_id: applyResponse.transaction.refNum,
          response_status: applyResponse.transaction.status,
          raw_data_from_fni: JSON.stringify(applyResponse),
        },
      );
      return 'ERROR';
    }

    if (applyResponse.transaction.status === 'SUCCESS') {
      await this.fniCommunicationModel.updateOne(
        { _id: fniModel._id },
        {
          received_on: new Date(),
          vendor_ref_id: applyResponse.transaction.refNum,
          response_status: applyResponse.transaction.status,
          response_code: applyResponse.application.code,
          raw_data_from_fni: JSON.stringify(applyResponse),
        },
      );
    }

    const status = this.translateFniResponseCode(applyResponse.application.code);
    // if (status === 'PENDING') {
    //   await this.fniCallbackService.updateSighten(applyResponse);
    // }

    return status;
  }

  async update(req: IFniUpdateReq): Promise<IFniUpdateRes> {
    let coinedErrorMessage = '';
    let fniCommunication = await this.fniCommunicationModel.findById(req.fniCommunicationId);

    if (!fniCommunication) {
      coinedErrorMessage = `FNI Communication Id: ${req.fniCommunicationId} not found !!!`;

      const now = new Date();
      fniCommunication = new this.fniCommunicationModel({
        qualification_credit_id: req.qualificationCreditId,
        received_on: now,
        sent_on: now,
        vendor_ref_id: req.vendorRefId,
        request_category: REQUEST_CATEGORY.CREDIT,
        request_type: REQUEST_TYPE.INBOUND,
        response_status: 'FAILURE IN WAVE',
        response_code: req.code,
        raw_data_from_fni: req.rawRequest,
      });

      await fniCommunication.save();
    } else {
      fniCommunication.raw_data_from_fni = req.rawRequest;
    }

    if (fniCommunication.vendor_ref_id !== req.vendorRefId) {
      coinedErrorMessage = `${coinedErrorMessage} - VendorId: ${req.vendorRefId} not found !!!`;
    }

    if (fniCommunication.qualification_credit_id !== req.qualificationCreditId) {
      coinedErrorMessage = `${coinedErrorMessage} - Credit Qualification Id: ${req.qualificationCreditId} not found !!!`;
    }

    const qualificationCredit = await this.qualificationService.getOneById(fniCommunication.qualification_credit_id);
    if (!qualificationCredit) {
      coinedErrorMessage = `${coinedErrorMessage} - Credit Qualification Id: ${req.qualificationCreditId} not found !!!`;
    }

    const res = {} as IFniUpdateRes;

    if (coinedErrorMessage.length > 0) {
      coinedErrorMessage = `ERROR: ${coinedErrorMessage}`;
      res.refNum = req.vendorRefId;
      res.status = 'ERROR';
      res.errorMsgs = [{ fieldId: null as any, errorType: 'GENERAL', message: coinedErrorMessage }];

      fniCommunication.error_message_sent_to_fni = [JSON.stringify(res), ...fniCommunication.error_message_sent_to_fni];
      await this.fniCommunicationModel.updateOne({ _id: fniCommunication._id }, fniCommunication.toObject());

      return res;
    }

    const fniResponseCode = this.translateFniResponseCode(req.code);
    try {
      this.qualificationService.handleFNIResponse(
        fniResponseCode,
        'System - FNI Triggered',
        qualificationCredit as any,
      );
      res.refNum = req.vendorRefId;
      res.status = 'SUCCESS';
      fniCommunication.error_message_sent_to_fni = [JSON.stringify(res), ...fniCommunication.error_message_sent_to_fni];
    } catch (error) {
      res.refNum = req.vendorRefId;
      res.status = 'ERROR';
      res.errorMsgs = [{ fieldId: null as any, errorType: 'GENERAL', message: 'System Error' }];
      fniCommunication.error_message_sent_to_fni = [JSON.stringify(res), ...fniCommunication.error_message_sent_to_fni];
    }

    await this.fniCommunicationModel.updateOne({ _id: fniCommunication._id }, fniCommunication.toObject());

    return res;
  }

  getSecretManager = (secretName: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const { AWS_REGION } = process.env;
      const client = new AWS.SecretsManager({ region: AWS_REGION });
      let returnValue: string;
      client.getSecretValue({ SecretId: secretName }, (err, data) => {
        if (err) {
          console.log('error line 203::fni-engine.service.ts::', err);
          return reject(err);
        }

        if ('SecretString' in data) {
          returnValue = data.SecretString;
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
}
