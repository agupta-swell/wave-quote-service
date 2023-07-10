import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as AWS from 'aws-sdk';
import { Model } from 'mongoose';
import { ExternalService } from '../../external-services/external-service.service';
import { FNI_APPLICATION_STATE, FNI_REQUEST_TYPE, FNI_TRANSACTION_STATUS, REQUEST_CATEGORY, REQUEST_TYPE } from '../constants';
import { QualificationService } from '../qualification.service';
import { FNI_Communication, FNI_COMMUNICATION } from '../schemas/fni-communication.schema';
import { IApplyRequest, IFniApplyReq, IFniProcessReq, IFniUpdateReq, IFniUpdateRes } from '../typing.d';
import { ProcessCreditQualificationReqDto } from '../req/process-credit-qualification.dto';
import { IFniApplication, QUALIFICATION_CREDIT, QualificationCredit } from '../qualification.schema';

@Injectable()
export class FniEngineService {
  AWS_REGION: string;

  client: AWS.SecretsManager;

  constructor(
    @InjectModel(FNI_COMMUNICATION) private readonly fniCommunicationModel: Model<FNI_Communication>,
    private readonly externalService: ExternalService,
    @Inject(forwardRef(() => QualificationService)) private qualificationService: QualificationService,
    @InjectModel(QUALIFICATION_CREDIT) private readonly qualificationCreditModel: Model<QualificationCredit>,
  ) {
    const { AWS_REGION } = process.env;

    this.client = new AWS.SecretsManager({
      region: AWS_REGION,
    });
  }

  async processFniSolarApplyRequest(req: ProcessCreditQualificationReqDto): Promise<string> {
    const qualificationCredit = await this.qualificationCreditModel.findById(req.qualificationCreditId);
    if (!qualificationCredit) {
      throw new NotFoundException('qualificationCredit not found');
    }
    const activeFniApplication = this.findActiveFniApplication(qualificationCredit);
    if (!activeFniApplication) {
      throw new NotFoundException('qualificationCredit record has no ACTIVE fniApplication');
    }

    const fniKey: any = JSON.parse(await this.getSecretManager(process.env.FNI_SECRET_MANAGER_NAME as string));
    const processReq: IFniProcessReq = {
      transaction: {
        key: fniKey.fni.key,
        hash: fniKey.fni.hash,
        partnerId: fniKey.fni.partnerId,
        refnum: req.refnum
      }
    };

    const applyResponse = await this.externalService.getFniResponse(processReq);
    if(!applyResponse || !applyResponse.transaction) {
      throw new NotFoundException('FNI Response to fni_apply is undefined or contains no transaction');
    }

    const transactionStatus = applyResponse.transaction.status;
    if (transactionStatus === 'ERROR') {
      activeFniApplication.responses ??= [];
      activeFniApplication.responses.push({
        type: FNI_REQUEST_TYPE.SOLAR_APPLY,
        transactionStatus: FNI_TRANSACTION_STATUS.ERROR,
        rawResponse: {
          transaction: applyResponse.transaction,
          stips: applyResponse.stips,
          application: applyResponse.application,
          approved_offers: applyResponse.approved_offers,
          decision_offers: applyResponse.decision_offers,
          disbursements: applyResponse.disbursements,
          product_decisions: applyResponse.product_decisions,
          field_descriptions: applyResponse.field_descriptions
        },
        createdAt: new Date()
      });
    }

    if (transactionStatus === 'SUCCESS') {
      activeFniApplication.fniCurrentDecisionReceivedAt = applyResponse.timeReceived;
      activeFniApplication.fniCurrentDecision = applyResponse.currDecision;
      activeFniApplication.responses ??= [];
      activeFniApplication.responses.push({
        type: FNI_REQUEST_TYPE.SOLAR_APPLY,
        transactionStatus: FNI_TRANSACTION_STATUS.SUCCESS,
        rawResponse: {
          transaction: applyResponse.transaction,
          stips: applyResponse.stips,
          application: applyResponse.application,
          approved_offers: applyResponse.approved_offers,
          decision_offers: applyResponse.decision_offers,
          disbursements: applyResponse.disbursements,
          product_decisions: applyResponse.product_decisions,
          field_descriptions: applyResponse.field_descriptions
        },
        createdAt: new Date()
      });
    }

    qualificationCredit.save();

    return transactionStatus;
  }

  // NOTE: NEVER NEVER NEVER NEVER store the fniApplyRequestParam or applyRequestInst in the database
  // NOTE: NEVER NEVER NEVER NEVER log the fniApplyRequestParam or applyRequestInst
  // NOTE: Copy this warning and paste it in the code at the top and bottom of this method

  async apply(req: IFniApplyReq): Promise<string> {
    const fniModel = new this.fniCommunicationModel({
      qualificationCreditId: req.qualificationCreditId,
      sentOn: new Date(),
      requestCategory: REQUEST_CATEGORY.CREDIT,
      requestType: REQUEST_TYPE.OUTBOUND,
    });

    const fniKey: any = JSON.parse(await this.getSecretManager(process.env.FNI_SECRET_MANAGER_NAME as string));

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
        dob: req.primaryApplicantSecuredData.dob.toString(),
        soc: req.primaryApplicantSecuredData.soc.toString(),
        primAddr: req.primaryApplicantData.addressLine1,
        primAttn: req.primaryApplicantData.addressLine2,
        primCity: req.primaryApplicantData.city,
        primState: req.primaryApplicantData.state,
        primZip: req.primaryApplicantData.zipcode.toString(),
      },
    } as IApplyRequest;

    if (req.coApplicantData && req.coApplicantSecuredData) {
      applyReq.applicant2 = {
        first: req.coApplicantData.firstName,
        mi: req.coApplicantData.middleName,
        sightenId: req.qualificationCreditId.toString(),
        last: req.coApplicantData.lastName,
        eMail: req.coApplicantData.email,
        phnum: req.coApplicantData.phoneNumber,
        dob: req.coApplicantSecuredData.dob.toString(),
        soc: req.coApplicantSecuredData.soc.toString(),
        coAddr: req.coApplicantData.addressLine1,
        coAttn: req.coApplicantData.addressLine2,
        coCity: req.coApplicantData.city,
        coState: req.coApplicantData.state,
        coZip: req.coApplicantData.zipcode.toString(),
      };
    }
    const applyResponse = await this.externalService.getFniResponse(applyReq);
    if (applyResponse.transaction.status === 'ERROR') {
      fniModel.receivedOn = new Date();
      fniModel.vendorRefId = applyResponse.transaction.refNum;
      fniModel.responseStatus = applyResponse.transaction.status;
      fniModel.rawDataFromFni = JSON.stringify(applyResponse);

      await fniModel.save();

      return 'ERROR';
    }

    if (applyResponse.transaction.status === 'SUCCESS') {
      fniModel.receivedOn = new Date();
      fniModel.vendorRefId = applyResponse.transaction.refNum;
      fniModel.responseStatus = applyResponse.transaction.status;
      fniModel.responseCode = applyResponse.application.code;
      fniModel.rawDataFromFni = JSON.stringify(applyResponse);

      await fniModel.save();
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
        qualificationCreditId: req.qualificationCreditId,
        receivedOn: now,
        sentOn: now,
        vendorRefId: req.vendorRefId,
        requestCategory: REQUEST_CATEGORY.CREDIT,
        requestType: REQUEST_TYPE.INBOUND,
        responseStatus: 'FAILURE IN WAVE',
        responseCode: req.code,
        rawDataFromFni: req.rawRequest,
      });

      await fniCommunication.save();
    } else {
      fniCommunication.rawDataFromFni = req.rawRequest;
    }

    if (fniCommunication.vendorRefId !== req.vendorRefId) {
      coinedErrorMessage = `${coinedErrorMessage} - VendorId: ${req.vendorRefId} not found !!!`;
    }

    if (fniCommunication.qualificationCreditId !== req.qualificationCreditId) {
      coinedErrorMessage = `${coinedErrorMessage} - Credit Qualification Id: ${req.qualificationCreditId} not found !!!`;
    }

    const qualificationCredit = await this.qualificationService.getOneById(fniCommunication.qualificationCreditId);
    if (!qualificationCredit) {
      coinedErrorMessage = `${coinedErrorMessage} - Credit Qualification Id: ${req.qualificationCreditId} not found !!!`;
    }

    const res = {} as IFniUpdateRes;

    if (coinedErrorMessage.length > 0) {
      coinedErrorMessage = `ERROR: ${coinedErrorMessage}`;
      res.refNum = req.vendorRefId;
      res.status = 'ERROR';
      res.errorMsgs = [{ fieldId: null as any, errorType: 'GENERAL', message: coinedErrorMessage }];

      fniCommunication.errorMessageSentToFni.unshift(JSON.stringify(res));

      await fniCommunication.save();

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
      fniCommunication.errorMessageSentToFni.unshift(JSON.stringify(res));
    } catch (error) {
      res.refNum = req.vendorRefId;
      res.status = 'ERROR';
      res.errorMsgs = [{ fieldId: null as any, errorType: 'GENERAL', message: 'System Error' }];
      fniCommunication.errorMessageSentToFni.unshift(JSON.stringify(res));
    }

    await fniCommunication.save();

    return res;
  }

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

  findActiveFniApplication(qualificationCredit: QualificationCredit): IFniApplication | undefined {
    const fniApplications = qualificationCredit.fniApplications;
    if (!qualificationCredit.fniApplications) {
      throw new NotFoundException('qualificationCredit has no fniApplications');
    }
    
    for(var i = 0; i < fniApplications.length; i++) {
      if(fniApplications[i].state === FNI_APPLICATION_STATE.ACTIVE) {
        return fniApplications[i];
      }
    }
  }
}
