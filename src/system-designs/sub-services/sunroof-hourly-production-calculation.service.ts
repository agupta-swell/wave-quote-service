import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { LeanDocument, ObjectId } from 'mongoose';
import { ECommerceService } from 'src/e-commerces/e-commerce.service';
import { ProductionDeratesService } from 'src/production-derates-v2/production-derates-v2.service';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { IEnergyProfileProduction } from 'src/system-productions/system-production.schema';
import { IInverterSchema, SystemDesign } from '../system-design.schema';

@Injectable()
export class SunroofHourlyProductionCalculation {
  private readonly GOOGLE_SUNROOF_S3_BUCKET: string;

  constructor(
    private readonly s3Service: S3Service,
    private readonly productionDeratesService: ProductionDeratesService,
    @Inject(forwardRef(() => ECommerceService))
    private readonly eCommerceService: ECommerceService,
  ) {
    const bucket = process.env.GOOGLE_SUNROOF_S3_BUCKET;

    if (!bucket) throw new Error('Missing GOOGLE_SUNROOF_S3_BUCKET environment variable');

    this.GOOGLE_SUNROOF_S3_BUCKET = bucket;
  }

  public async getS3HourlyProduction(
    opportunityId: string,
    systemDesignId: string | ObjectId,
  ): Promise<IEnergyProfileProduction | undefined> {
    const filenames = [
      this.getClippingHourlyProductionS3Name(opportunityId, systemDesignId),
      this.getNonClippingHourlyProductionS3Name(opportunityId, systemDesignId),
    ];

    const res = await Promise.allSettled(
      filenames.map(filename => this.s3Service.getObject(this.GOOGLE_SUNROOF_S3_BUCKET, filename)),
    );

    const data = res
      .filter((res): res is PromiseFulfilledResult<string | undefined> => res.status === 'fulfilled')
      .map(res => res.value);

    const hourlyProduction = data[0] || data[1];

    if (!hourlyProduction) return undefined;

    return JSON.parse(hourlyProduction);
  }

  public calculateMaxInverterPower(systemDesign: SystemDesign | LeanDocument<SystemDesign>): number | undefined {
    const {
      roofTopDesignData: { inverters },
    } = systemDesign;

    const [inverter] = inverters;

    if (!inverter) return undefined;

    return this.calculateMaxInvertedKWh(inverter);
  }

  public clipArrayByInverterPower(values: number[], capValue: number): number[] {
    return values.map(v => Math.min(v, capValue));
  }

  private calculateMaxInvertedKWh(inverter: IInverterSchema): number {
    return (inverter.inverterModelDataSnapshot.ratings.watts * inverter.quantity) / 1000;
  }

  private async saveToS3(key: string, sunroofHourlyProduction: IEnergyProfileProduction): Promise<void> {
    const payload = JSON.stringify(sunroofHourlyProduction);

    const contentType = 'application/json';

    await this.s3Service.putObject(this.GOOGLE_SUNROOF_S3_BUCKET, key, payload, contentType);
  }

  private getClippingHourlyProductionS3Name(opportunityId: string, systemDesignId: string | ObjectId): string {
    return `${opportunityId}/${systemDesignId.toString()}/hourly-production/clipped.json`;
  }

  private getNonClippingHourlyProductionS3Name(opportunityId: string, systemDesignId: string | ObjectId): string {
    return `${opportunityId}/${systemDesignId.toString()}/hourly-production/non-clipped.json`;
  }
}
