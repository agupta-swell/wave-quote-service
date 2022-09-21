import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { Observable, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { PreAuthenticate } from 'src/app/securities';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { TransformTypicalUsage } from 'src/utilities/interceptors';
import {
  calculateElectricVehicle,
  calculatePlannedUsageIncreasesKwh,
  calculatePoolUsageKwh,
  mapToResult,
} from 'src/utilities/operators';
import { UtilityService } from 'src/utilities/utility.service';
import { EnergyProfileService } from './energy-profile.service';
import { GetEnergyProfileResDto } from './res/energy-profile.dto';

@Controller('energy-profiles')
@PreAuthenticate()
export class EnergyProfileController {
  constructor(
    private readonly energyProfileService: EnergyProfileService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get(':opportunityId/:systemDesignId')
  @TransformTypicalUsage(
    calculatePlannedUsageIncreasesKwh,
    calculatePoolUsageKwh,
    calculateElectricVehicle,
    mapToResult(GetEnergyProfileResDto),
  )
  @ApiOperation({ summary: 'Get Energy Profile detail by systemDesignId' })
  @ApiOkResponse({ type: GetEnergyProfileResDto })
  get(
    @Param('systemDesignId', ParseObjectIdPipe) systemDesignId: ObjectId,
    @Param('opportunityId') opportunityId: string,
  ): Observable<any> {
    const result = zip(
      this.utilityService.getTypicalUsage$(opportunityId),
      this.energyProfileService.getSunroofHourlyProduction(systemDesignId),
      this.energyProfileService.getBatteryChargingSeries(systemDesignId),
      this.energyProfileService.getBatteryDischargingSeries(systemDesignId),
      this.energyProfileService.getExistingSystemProductionSeries(opportunityId),
      this.energyProfileService.getBatteryDataSeriesForTypicalDay(systemDesignId),
      this.energyProfileService.getPostInstallSiteDemandSeries(systemDesignId),
    ).pipe(
      map(
        ([
          usage,
          solarProduction,
          batteryChargingSeries,
          batteryDischargingSeries,
          existingSystemProduction,
          batteryDataSeriesForTypicalDay,
          postInstallSiteDemandSeries,
        ]) => ({
          ...usage,
          solarProduction,
          batteryChargingSeries,
          batteryDischargingSeries,
          existingSystemProduction,
          batteryDataSeriesForTypicalDay,
          postInstallSiteDemandSeries,
        }),
      ),
    );
    return result;
  }
}
