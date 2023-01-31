import { forwardRef, Inject, Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { sum, sumBy } from 'lodash';
import { LeanDocument, ObjectId } from 'mongoose';
import { ECommerceService } from 'src/e-commerces/e-commerce.service';
import { ProductionDeratesService } from 'src/production-derates-v2/production-derates-v2.service';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { SystemProduction } from 'src/shared/google-sunroof/types';
import { IEnergyProfileProduction, ISystemProduction } from 'src/system-productions/system-production.schema';
import { getDaysInMonth } from 'src/utils/datetime';
import { roundNumber } from 'src/utils/transformNumber';
import { IInverterSchema, ISolarPanelArraySchema, SystemDesign } from '../system-design.schema';

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

  public async calculateClippingSunroofProduction(
    systemDesign: SystemDesign | LeanDocument<SystemDesign>,
    systemProduction: ISystemProduction | LeanDocument<ISystemProduction>,
    sunroofProduction?: SystemProduction,
  ): Promise<IEnergyProfileProduction> {
    const {
      roofTopDesignData: { inverters, panelArray },
    } = systemDesign;

    const maxInverterPower = this.calculateMaxInverterPower(systemDesign);

    let sunroofHourlyProduction = this.calculateSunroofHourlyProduction(systemProduction, sunroofProduction);

    // apply first year degradation
    const [firstPanelArray] = panelArray;

    const firstYearDegradation = (firstPanelArray?.panelModelDataSnapshot?.firstYearDegradation ?? 0) / 100;

    const soilingLosses = await this.eCommerceService.getSoilingLossesByOpportunityId(systemDesign.opportunityId);

    const multipliedByDegrade = v => roundNumber(v * (1 - firstYearDegradation) * (1 - soilingLosses / 100));

    sunroofHourlyProduction = {
      annualAverage: sunroofHourlyProduction.annualAverage.map(v => multipliedByDegrade(v)),
      monthlyAverage: sunroofHourlyProduction.monthlyAverage.map(monthly => monthly.map(v => multipliedByDegrade(v))),
    };

    const s3Actions = [
      this.saveToS3(
        this.getNonClippingHourlyProductionS3Name(systemDesign.opportunityId, systemDesign._id),
        sunroofHourlyProduction,
      ),
    ];

    if (maxInverterPower) {
      const [inverter] = inverters;

      const inverterEfficiency = (inverter.inverterModelDataSnapshot.inverterEfficiency ?? 100) / 100;

      const clippedProduction: IEnergyProfileProduction = {
        annualAverage: this.clipArrayByInverterPower(sunroofHourlyProduction.annualAverage, maxInverterPower).map(v =>
          roundNumber(v * inverterEfficiency, 2),
        ),
        monthlyAverage: sunroofHourlyProduction.monthlyAverage.map(monthly =>
          this.clipArrayByInverterPower(monthly, maxInverterPower).map(v => roundNumber(v * inverterEfficiency, 2)),
        ),
      };

      s3Actions.push(
        this.saveToS3(
          this.getClippingHourlyProductionS3Name(systemDesign.opportunityId, systemDesign._id),
          clippedProduction,
        ),
      );

      await Promise.all(s3Actions);

      return this.calculateFinalSunroofProduction(clippedProduction);
    }

    s3Actions.push(
      this.s3Service.deleteObject(
        this.GOOGLE_SUNROOF_S3_BUCKET,
        this.getClippingHourlyProductionS3Name(systemDesign.opportunityId, systemDesign._id),
      ),
    );

    await Promise.all(s3Actions);

    return this.calculateFinalSunroofProduction(sunroofHourlyProduction);
  }

  private async calculateFinalSunroofProduction(
    production: IEnergyProfileProduction,
  ): Promise<IEnergyProfileProduction> {
    const productionDerates = await this.productionDeratesService.getAllProductionDerates();

    let ratio = 1;

    productionDerates.data?.forEach(item => {
      ratio *= 1 - (item.amount || 0) / 100;
    });

    const finalSunroofHourlyProduction = {
      annualAverage: production.annualAverage.map(v => roundNumber(v * ratio, 2)),
      monthlyAverage: production.monthlyAverage.map(monthly => monthly.map(v => roundNumber(v * ratio, 2))),
    };
    return finalSunroofHourlyProduction;
  }

  public calculateMaxInverterPower(systemDesign: SystemDesign | LeanDocument<SystemDesign>): number | undefined {
    const {
      roofTopDesignData: { inverters, panelArray },
    } = systemDesign;

    const [inverter] = inverters;

    if (!inverter) return undefined;

    const totalPanels = this.getTotalPanels(panelArray);

    return this.calculateMaxInvertedKWh(inverter, totalPanels);
  }

  private calculateSunroofHourlyProduction(
    systemProduction: ISystemProduction | LeanDocument<ISystemProduction>,
    sunroofProduction?: SystemProduction,
  ): IEnergyProfileProduction {
    const monthlyProduction = sunroofProduction?.monthlyProduction ?? systemProduction.generationMonthlyKWh;
    const annualProduction = sunroofProduction?.annualProduction ?? sum(systemProduction.arrayGenerationKWh);

    const { annualAverage, monthlyAverage } = systemProduction.pvWattProduction;

    return {
      annualAverage: this.calculateSunroofAnnualHourlyProduction(annualAverage, annualProduction),
      monthlyAverage: this.calculateSunroofMonthlyHourlyProduction(monthlyAverage, monthlyProduction),
    };
  }

  private calculateSunroofAnnualHourlyProduction(annualAverage: number[], sunroofAnnualProduction: number): number[] {
    const totalHourly = annualAverage.reduce((acc, cur) => acc.plus(cur), new BigNumber(0)).toNumber();

    return annualAverage.map(hourly => roundNumber((hourly * sunroofAnnualProduction) / 365 / totalHourly, 2));
  }

  private calculateSunroofMonthlyHourlyProduction(
    monthlyAverage: number[][],
    sunroofMonthlyProduction: number[],
  ): number[][] {
    const currentYear = new Date().getFullYear();

    return monthlyAverage.map((monthly, monthIdx) => {
      const totalHourly = monthly.reduce((acc, cur) => acc.plus(cur), new BigNumber(0)).toNumber();

      const totalDays = getDaysInMonth(currentYear, monthIdx);

      const sunroofProduction = sunroofMonthlyProduction[monthIdx];

      const ratio = sunroofProduction / totalHourly / totalDays;

      return monthly.map(hourly => roundNumber(hourly * ratio, 2));
    });
  }

  public clipArrayByInverterPower(values: number[], capValue: number): number[] {
    return values.map(v => Math.min(v, capValue));
  }

  private getTotalPanels(panels: ISolarPanelArraySchema[]): number {
    return sumBy(panels, panel => panel.numberOfPanels);
  }

  private calculateMaxInvertedKWh(inverter: IInverterSchema, numberOfPanels: number): number {
    return (inverter.inverterModelDataSnapshot.ratings.watts * numberOfPanels) / 1000;
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
