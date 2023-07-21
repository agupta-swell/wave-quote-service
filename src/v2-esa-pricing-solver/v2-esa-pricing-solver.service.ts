import { parse } from 'papaparse';
import { Injectable, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { V2_MANUFACTURERS_COLL, Manufacturer } from 'src/manufacturers/manufacturer.schema';
import { UtilityMaster, UTILITY_MASTER } from 'src/docusign-templates-master/schemas/utility-master.schema';
import { convertStringWithCommasToNumber } from 'src/utils/common';
import { FastifyRequest } from 'src/shared/fastify';
import { OperationResult } from '../app/common/operation-result';
import { V2EsaPricingSolverDocument, V2EsaPricingSolver } from './interfaces';
import { V2_ESA_PRICING_SOLVER_COLLECTION } from './constants';

@Injectable()
export class EsaPricingSolverService {
  constructor(
    @InjectModel(V2_ESA_PRICING_SOLVER_COLLECTION) private esaPricingSolverModel: Model<V2EsaPricingSolverDocument>,
    @InjectModel(V2_MANUFACTURERS_COLL) private manufacturerModel: Model<Manufacturer>,
    @InjectModel(UTILITY_MASTER) private utilitiesMasterModel: Model<UtilityMaster>,
  ) {}

  async createDataFromCSV(@Req() req: FastifyRequest): Promise<OperationResult<string>> {
    try {
      const file = await req.file();
      const rawCSV = (await file.toBuffer()).toString().trim() as string;
      const { data } = parse<string[]>(rawCSV);

      const handlers = data.map(async (values, index) => {
        if (index === 0) return;

        const [manufacturer, utilities] = await Promise.all([
          this.manufacturerModel.findOne({ name: values[2] }).lean(),
          this.utilitiesMasterModel.find({ utilityName: { $in: values[4]?.split(';') || [] } }).lean(),
        ]);

        const payload: V2EsaPricingSolver = {
          termYears: convertStringWithCommasToNumber(values[0]),
          storageSizeKWh: convertStringWithCommasToNumber(values[1]),
          storageManufacturerId: manufacturer?._id || 'N/A',
          state: values[3],
          applicableUtilities: utilities.map(item => item._id) || [],
          projectTypes: values[5]?.split('_') || [],
          rateEscalator: convertStringWithCommasToNumber(values[6]),
          coefficientA: convertStringWithCommasToNumber(values[7]),
          coefficientB: convertStringWithCommasToNumber(values[8]),
          coefficientC: convertStringWithCommasToNumber(values[9]),
          coefficientD: convertStringWithCommasToNumber(values[10]),
          maxPricePerWatt: convertStringWithCommasToNumber(values[11]),
          minPricePerWatt: convertStringWithCommasToNumber(values[12]),
          maxDollarKwhRate: convertStringWithCommasToNumber(values[13]),
          minDollarKwhRate: convertStringWithCommasToNumber(values[14]),
          maxPricePerKwh: convertStringWithCommasToNumber(values[15]),
          minPricePerKwh: convertStringWithCommasToNumber(values[16]),
        };

        const newEsaPricingSolver = new this.esaPricingSolverModel(payload);
        // eslint-disable-next-line consistent-return
        return newEsaPricingSolver.save();
      });

      await Promise.all(handlers);
      return OperationResult.ok('Upload Success!');
    } catch (error) {
      throw ApplicationException.UnprocessableEntity('Upload Failed!');
    }
  }
}
