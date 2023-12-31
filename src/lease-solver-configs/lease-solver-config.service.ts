import { Injectable, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from '../app/common/operation-result';
import { fromStream } from '../utils/convertToCSV';
import { LeaseSolverConfig, LEASE_SOLVER_CONFIG } from './lease-solver-config.schema';
import { IGetDetail } from './typing.d';

@Injectable()
export class LeaseSolverConfigService {
  constructor(@InjectModel(LEASE_SOLVER_CONFIG) private leaseSolverConfig: Model<LeaseSolverConfig>) {}

  async createDataFromCSV(@Req() req: any): Promise<OperationResult<string>> {
    const csv = await fromStream(await req.file());
    const header = [
      'solar', // 0
      'retrofit', // 1
      'utility_program', // 2
      'contract_term', // 3
      'storage_size', // 4
      'solar_size_min', // 5
      'solar_size_max', // 6
      'adjusted_install_cost', // 7
      'rate_factor', // 8
      'productivity_min', // 9
      'productivity_max', /// 10
      'rate_escalator', // 11
      'rate_per_kWh', // 12
      'storage_pmt', // 13
      'grid_services_discount', // 14
      'external_program_id', // 15
    ];

    const data = csv.map((item, index) => {
      if (index === 0) return;
      const values = item.split(',');
      const isSolar = values[0].replace(/\r?\n|\r/, '');
      const leaseConfig = new this.leaseSolverConfig({
        is_solar: isSolar === 'TRUE',
        is_retrofit: values[1] === 'TRUE',
        utility_program_name: values[2],
        contract_term: values[3],
        storage_size: values[4],
        solar_size_minimum: values[5],
        solar_size_maximum: values[6],
        adjusted_install_cost: values[7],
        rate_factor: values[8],
        productivity_min: values[9],
        productivity_max: values[10],
        rate_escalator: values[11],
        rate_per_kWh: values[12],
        storage_payment: values[13],
        grid_services_discount: values[14],
      });
      // eslint-disable-next-line consistent-return
      return leaseConfig.save();
    });

    await Promise.all(data);
    return OperationResult.ok('okeeeeeee');
  }

  // --->>>>>>>>>>>>>>>>>>>> INTERNAL <<<<<<<<<<<<<<<<<<<<---

  async getDetailByConditions(condition: IGetDetail): Promise<LeaseSolverConfig | null> {
    const {
      capacityKW,
      productivity,
      isSolar,
      utilityProgramName,
      contractTerm,
      rateEscalator,
      tier,
      storageSize,
      storageManufacturer,
    } = condition;

    const query = {
      tier: { $in: [null, tier] },
      isSolar,
      utilityProgramName,
      contractTerm,
      storageSize,
      storageManufacturer: { $in: [null, storageSize > 0 ? storageManufacturer : 'None'] },
      rateEscalator,
      solarSizeMinimum: { $lte: capacityKW },
      solarSizeMaximum: { $gt: capacityKW },
      productivityMin: { $lte: productivity },
      productivityMax: { $gt: productivity },
    };

    const leaseSolverConfig = await this.leaseSolverConfig.findOne(query);
    return leaseSolverConfig;
  }

  async getListSolverConfigsByConditions(isSolar: boolean, utilityProgramName: string): Promise<LeaseSolverConfig[]> {
    const leaseSolverConfig = await this.leaseSolverConfig.find({
      isSolar,
      utilityProgramName,
    });

    return leaseSolverConfig;
  }

  async getMinMaxLeaseSolver(
    isSolar: boolean,
    utilityProgramName: string,
  ): Promise<{
    solarSizeMinimumArr: number;
    solarSizeMaximumArr: number;
    productivityMinArr: number;
    productivityMaxArr: number;
    storageSizeArr: number[];
    contractTermArr: number[];
    storageManufacturerArr: string[];
  }> {
    const found = await this.leaseSolverConfig.aggregate([
      {
        $match: {
          is_solar: isSolar,
          utility_program_name: utilityProgramName,
        },
      },
      {
        $group: {
          _id: {
            is_solar: '$is_solar',
            utility_program_name: '$utility_program_name',
          },
          solarSizeMinimumArr: {
            $min: '$solar_size_minimum',
          },
          solarSizeMaximumArr: {
            $max: '$solar_size_maximum',
          },
          productivityMinArr: {
            $min: '$productivity_min',
          },
          productivityMaxArr: {
            $max: '$productivity_max',
          },
          storageSizeArr: {
            $addToSet: '$storage_size',
          },
          contractTermArr: {
            $addToSet: '$contract_term',
          },
          storageManufacturerArr: {
            $addToSet: '$storage_manufacturer',
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    if (!found[0]) {
      throw ApplicationException.NotFoundStatus('Lease Config');
    }

    return found[0];
  }
}
