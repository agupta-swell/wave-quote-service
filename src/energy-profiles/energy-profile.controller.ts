import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { Observable, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { PreAuthenticate } from 'src/app/securities';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { TransformTypicalUsage } from 'src/utilities/interceptors';
import { mapToResult } from 'src/utilities/operators';
import { EnergyProfileService } from './energy-profile.service';
import { GetEnergyProfileResDto } from './res/energy-profile.dto';

@Controller('/energy-profiles')
@PreAuthenticate()
export class EnergyProfileController {
  constructor(private readonly energyProfileService: EnergyProfileService) {}

  @Get(':opportunityId/:systemDesignId')
  @TransformTypicalUsage(mapToResult(GetEnergyProfileResDto))
  @ApiOperation({ summary: 'Get Energy Profile detail by systemDesignId' })
  @ApiOkResponse({ type: GetEnergyProfileResDto })
  get(
    @Param('systemDesignId', ParseObjectIdPipe) systemDesignId: ObjectId,
    @Param('opportunityId') opportunityId: string,
  ): Observable<any> {
    const result = zip(
      this.energyProfileService.getExpectedUsage(opportunityId),
      this.energyProfileService.getSunroofHourlyProduction(systemDesignId),
      this.energyProfileService.getBatteryChargingSeries(systemDesignId),
      this.energyProfileService.getBatteryDischargingSeries(systemDesignId),
      this.energyProfileService.getExistingSystemProductionSeries(opportunityId),
      this.energyProfileService.getBatteryDataSeriesForTypicalDay(systemDesignId),
      this.energyProfileService.getNetLoadAverage(systemDesignId),
    ).pipe(
      map(
        ([
          expectedUsage,
          solarProduction,
          batteryChargingSeries,
          batteryDischargingSeries,
          existingSystemProduction,
          batteryDataSeriesForTypicalDay,
          netLoadAverage,
        ]) => ({
          expectedUsage,
          solarProduction,
          batteryChargingSeries,
          batteryDischargingSeries,
          existingSystemProduction,
          batteryDataSeriesForTypicalDay,
          netLoadAverage,
        }),
      ),
    );
    return result;
  }
}
