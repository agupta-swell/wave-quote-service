import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { groupBy, orderBy } from 'lodash';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from '../app/common';
import { CALCULATION_TYPE, SERVICE_RESPONSE_STATUS_TYPE } from './constants';
import { GetSavingReqDto } from './req/get-saving.dto';
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
        storage_rate_type: req.loadDataDetail.storageRateType,
        battery: req.systemDesignDataDetail.storageDetailsData.batteryModel,
        battery_count: req.systemDesignDataDetail.storageDetailsData.batteryCount,
        bau_rate: req.loadDataDetail.bauRateType,
        pv_rate: req.loadDataDetail.pvRateType,
        annual_load: req.loadDataDetail.annualLoad,
        pv_capacity: req.systemDesignDataDetail.pvDetailsData.pvCapacity,
        charge_from_grid_max_percentage: req.systemDesignDataDetail.chargeFromGridMaxPercentage,
        financial_dict: req.systemDesignDataDetail.financialDict || null,
        grid_services: req.systemDesignDataDetail.gridServices,
        sgip: req.systemDesignDataDetail.sgip || null,
        grid_service_days: req.systemDesignDataDetail.gridServicesDays || null,
        export_limit: req.systemDesignDataDetail.exportLimit || null,
      })
      .lean();

    if (!scenario) {
      throw ApplicationException.EntityNotFound('scenario');
    }

    // FIXME: need to ask Michael
    const billSavings = await this.savingEngineBillModel
      .find({
        scenario_id: scenario._id,
        calculation_type: CALCULATION_TYPE.PRIMARY,
      })
      .lean();

    const orderedBy = orderBy(billSavings, ['scenario_type', 'rate_name_type']);

    if (!billSavings.length) {
      return OperationResult.ok(
        new GetSavingDto({
          serviceResponseStatus: {
            serviceResponseStatus: SERVICE_RESPONSE_STATUS_TYPE.FAILURE,
            failureMessage: 'No Matching Savings data found.',
          },
        }),
      );
    }

    const billSavingsGroupedData = groupBy(orderedBy, i => i.scenario_type);
    const scenarioDetailData: ScenarioDataDto[] = Object.keys(billSavingsGroupedData).map(
      item =>
        ({
          scenarioType: item as any,
          savingsDataDetail: billSavingsGroupedData[item].map(saving => ({
            rateNameType: saving.rate_name_type,
            costDataDetail: saving.cost,
          })),
        } as any),
    );

    return OperationResult.ok(
      new GetSavingDto({
        serviceResponseStatus: { serviceResponseStatus: SERVICE_RESPONSE_STATUS_TYPE.SUCCESS },
        scenarioDataDetail: scenarioDetailData,
      }),
    );
  }
}
