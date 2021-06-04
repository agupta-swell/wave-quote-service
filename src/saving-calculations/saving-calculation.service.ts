import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { groupBy, orderBy } from 'lodash';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { OperationResult } from '../app/common';
import { CALCULATION_TYPE, SERVICE_RESPONSE_STATUS_TYPE } from './constants';
import { GetSavingReqDto } from './req/get-saving.dto';
import { GetSavingDto } from './res/get-saving.dto';
import { ScenarioDataDto } from './res/sub-dto';
import { SavingEngineBill, SavingEngineScenario, SAVING_ENGINE_BILL, SAVING_ENGINE_SCENARIO } from './schemas';

@Injectable()
export class SavingCalculationService {
  constructor(
    @InjectModel(SAVING_ENGINE_BILL) private readonly savingEngineBillModel: Model<SavingEngineBill>,
    @InjectModel(SAVING_ENGINE_SCENARIO) private readonly savingEngineScenarioModel: Model<SavingEngineScenario>,
  ) {}

  async getSavings(req: GetSavingReqDto): Promise<OperationResult<GetSavingDto>> {
    // FIXME: need to ask Michael
    const scenario = await this.savingEngineScenarioModel
      .findOne({
        location: req.addressDataDetail.zipCode.toString(),
        storageRateType: req.loadDataDetail.storageRateType,
        battery: req.systemDesignDataDetail.storageDetailsData.batteryModel,
        batteryCount: req.systemDesignDataDetail.storageDetailsData.batteryCount,
        bauRate: req.loadDataDetail.bauRateType,
        pvRate: req.loadDataDetail.pvRateType,
        annualLoad: req.loadDataDetail.annualLoad,
        pvCapacity: req.systemDesignDataDetail.pvDetailsData.pvCapacity,
        chargeFromGridMaxPercentage: req.systemDesignDataDetail.chargeFromGridMaxPercentage,
        financialDict: req.systemDesignDataDetail.financialDict || null,
        gridServices: req.systemDesignDataDetail.gridServices,
        sgip: req.systemDesignDataDetail.sgip || null,
        gridServiceDays: req.systemDesignDataDetail.gridServicesDays || null,
        exportLimit: req.systemDesignDataDetail.exportLimit || null,
      })
      .lean();

    if (!scenario) {
      throw ApplicationException.EntityNotFound('scenario');
    }

    // FIXME: need to ask Michael
    const billSavings = await this.savingEngineBillModel
      .find({
        scenarioId: scenario._id,
        calculationType: CALCULATION_TYPE.PRIMARY,
      })
      .lean();

    const orderedBy = orderBy(billSavings, ['scenarioType', 'rateNameType']);

    if (!billSavings.length) {
      return OperationResult.ok(
        strictPlainToClass(GetSavingDto, {
          serviceResponseStatus: {
            serviceResponseStatus: SERVICE_RESPONSE_STATUS_TYPE.FAILURE,
            failureMessage: 'No Matching Savings data found.',
          },
        }),
      );
    }

    const billSavingsGroupedData = groupBy(orderedBy, i => i.scenarioId);
    const scenarioDetailData = Object.keys(billSavingsGroupedData).map(item => ({
      scenarioType: item,
      savingsDataDetail: billSavingsGroupedData[item].map(saving => ({
        rateNameType: saving.rateNameType,
        costDataDetail: saving.cost,
      })),
    }));

    return OperationResult.ok(
      strictPlainToClass(GetSavingDto, {
        serviceResponseStatus: { serviceResponseStatus: SERVICE_RESPONSE_STATUS_TYPE.SUCCESS },
        scenarioDataDetail: scenarioDetailData,
      }),
    );
  }
}
