import { Injectable, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fromStream } from '../utils/convertToCSV';
import { OperationResult } from './../app/common/operation-result';
import { LeaseSolverConfig, LEASE_SOLVER_CONFIG } from './lease-solver-config.schema';

@Injectable()
export class LeaseSolverConfigService {
  constructor(@InjectModel(LEASE_SOLVER_CONFIG) private leaseSolverConfig: Model<LeaseSolverConfig>) {}

  async createDataFromCSV(@Req() req: any): Promise<OperationResult<string>> {
    const [csv] = await Promise.all([fromStream(await req.file()), this.leaseSolverConfig.collection.drop()]);
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
        storageSize: values[4],
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
      return leaseConfig.save();
    });

    await Promise.all(data);
    return OperationResult.ok('okeeeeeee');
  }
}
