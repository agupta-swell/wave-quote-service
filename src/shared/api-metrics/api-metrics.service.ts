import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as dayjs from 'dayjs';
import { IV2APIMetrics, V2_API_METRICS } from './api-metrics.schema';

export class ApiMetricsService {
  constructor(@InjectModel(V2_API_METRICS) private readonly v2APIMetricsModel: Model<IV2APIMetrics>) {}

  async updateAPIMetrics({ vendor, method, route }): Promise<void> {
    const month = dayjs().format('YYYY-MM');

    await this.v2APIMetricsModel.findOneAndUpdate(
      { vendor, method, route, month },
      { $inc: { count: 1 } },
      { upsert: true },
    );
  }
}
