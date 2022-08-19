import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { isEqual } from 'lodash';
import { ServiceResponse } from 'src/app/common';
import { IQueueStore } from 'src/shared/async-context/interfaces';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { GoogleSunroofService } from 'src/shared/google-sunroof/google-sunroof.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { SystemProductionDto } from 'src/system-production/res';
import { SystemProductionService } from 'src/system-production/system-production.service';
import { calcCoordinatesDistance, getCenterBound, ICoordinate } from 'src/utils/calculate-coordinates';
import { SystemDesignDto } from '../res';
import { SunroofHourlyProductionCalculation } from '../sub-services';
import { ILatLngSchema, SystemDesign } from '../system-design.schema';
import { SystemDesignService } from '../system-design.service';
import { InitSystemDesign, ISystemDesignSchemaHook } from './ISystemDesignSchemaHook';

@Injectable()
export class SystemDesignHook implements ISystemDesignSchemaHook {
  private logger = new Logger(SystemDesignHook.name);

  constructor(
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
    private readonly s3Service: S3Service,
    private readonly googleSunroofService: GoogleSunroofService,
    private readonly systemProductionService: SystemProductionService,
    private readonly sunroofHourlyProductionCalculation: SunroofHourlyProductionCalculation,
  ) {}

  private WILL_GENERATE_PNG_SYM = Symbol('willGeneratePng');

  private WILL_GENERATE_OVERLAY_SYM = Symbol('willGenerateOverlay');

  private WILL_GENERATE_SUNROOF_PRODUCTION_SYM = Symbol('willGenerateSunroofProduction');

  dispatch(
    asyncQueueStore: IQueueStore,
    systemDesign: SystemDesign,
    initSystemDesign: InitSystemDesign,
    targetPanelArrayId: string,
    previousPanelArrayBoundPolygon: ILatLngSchema[],
    previousTotalPanelsInArray: number,
    isNewPanelArray: boolean,
    newPanelArrayBoundPolygon: ILatLngSchema[],
    newTotalPanelsInArray: number,
  ): void {
    if (isNewPanelArray) {
      this.dispatchNewPanelArray(asyncQueueStore, systemDesign, targetPanelArrayId, newPanelArrayBoundPolygon);
    }

    if (!this.canDispatchNextSystemDesignEvent(asyncQueueStore)) {
      return;
    }

    // Queue up all relevants task when new system design is created
    if (initSystemDesign.isNew) {
      const radiusMeters = this.calculateSystemDesignRadius(
        {
          lat: systemDesign.latitude,
          lng: systemDesign.longitude,
        },
        (systemDesign.roofTopDesignData?.panelArray?.map(p => p?.boundPolygon) ?? []).flat(),
      );

      this.queueGeneratePngs(asyncQueueStore, systemDesign, radiusMeters);
      asyncQueueStore.cache.set('onNewSystemDesign', true);
      return;
    }

    this.dispatchPanelArrayChange(
      asyncQueueStore,
      systemDesign,
      initSystemDesign,
      targetPanelArrayId,
      previousPanelArrayBoundPolygon,
      previousTotalPanelsInArray,
      isNewPanelArray,
      newPanelArrayBoundPolygon,
      newTotalPanelsInArray,
    );
  }

  private canRegenerateProduction(initSystemDesign: InitSystemDesign, systemDesign: SystemDesign): boolean {
    if (initSystemDesign.isNew) return false;

    if (systemDesign?.sunroofDriftCorrection?.x === 0 && systemDesign?.sunroofDriftCorrection?.y === 0) return false;

    return true;
  }

  private dispatchNewPanelArray(
    asyncQueueStore: IQueueStore,
    systemDesign: SystemDesign,
    targetPanelArrayId: string,
    newPanelArrayBoundPolygon: ILatLngSchema[],
  ) {
    const newCenterPoint = getCenterBound(newPanelArrayBoundPolygon);

    this.queueResaveClosestBuilding(
      asyncQueueStore,
      systemDesign._id.toString(),
      systemDesign.opportunityId,
      targetPanelArrayId,
      newCenterPoint.lat,
      newCenterPoint.lng,
    );
  }

  private dispatchPanelArrayChange(
    asyncQueueStore: IQueueStore,
    systemDesign: SystemDesign,
    initSystemDesign: InitSystemDesign,
    targetPanelArrayId: string,
    previousPanelArrayBoundPolygon: ILatLngSchema[],
    previousTotalPanelsInArray: number,
    isNewPanelArray: boolean,
    newPanelArrayBoundPolygon: ILatLngSchema[],
    newTotalPanelsInArray: number,
  ) {
    if (initSystemDesign.isNew) return;

    if (this.canRegenerateProduction(initSystemDesign, systemDesign)) {
      this.queueGenerateSunroofProduction(asyncQueueStore, systemDesign);
    }

    if (
      asyncQueueStore.cache.get(this.WILL_GENERATE_OVERLAY_SYM) ||
      asyncQueueStore.cache.get(this.WILL_GENERATE_PNG_SYM)
    ) {
      return;
    }

    const newTotalArrays = systemDesign.roofTopDesignData?.panelArray?.length ?? 0;

    if (
      newTotalArrays === initSystemDesign.totalArrays &&
      previousTotalPanelsInArray === newTotalPanelsInArray &&
      isEqual(previousPanelArrayBoundPolygon, newPanelArrayBoundPolygon)
    ) {
      return;
    }

    const { latitude, longitude, polygons } = initSystemDesign;

    const currentRadius = this.calculateSystemDesignRadius(
      {
        lat: latitude,
        lng: longitude,
      },
      polygons,
    );

    const { latitude: newLat, longitude: newLng } = systemDesign;

    const newPolygons = (systemDesign.roofTopDesignData?.panelArray?.map(p => p?.boundPolygon) ?? []).flat();

    const newRadius = this.calculateSystemDesignRadius(
      {
        lat: newLat,
        lng: newLng,
      },
      newPolygons,
    );

    if (newLat === latitude && newLng === longitude) {
      if (newRadius > currentRadius) {
        this.queueGeneratePngs(asyncQueueStore, systemDesign, newRadius);
        return;
      }

      this.queueGenerateArrayOverlay(asyncQueueStore, systemDesign);

      return;
    }

    this.queueGeneratePngs(asyncQueueStore, systemDesign, newRadius);
  }

  private queueGeneratePngs(asyncQueueStore: IQueueStore, systemDesign: SystemDesign, radiusMeters: number): void {
    const pending = asyncQueueStore.cache.get(this.WILL_GENERATE_PNG_SYM) as number;

    const overlayPending = asyncQueueStore.cache.get(this.WILL_GENERATE_OVERLAY_SYM) as number;

    const sunroofProdPending = asyncQueueStore.cache.get(this.WILL_GENERATE_SUNROOF_PRODUCTION_SYM) as number;

    if (overlayPending) {
      asyncQueueStore.beforeRes[overlayPending - 1] = async () => null;
    }

    if (sunroofProdPending) {
      asyncQueueStore.beforeRes[sunroofProdPending - 1] = async () => null;
    }

    const task = async () => {
      try {
        await this.googleSunroofService.generateHeatmapPngs(systemDesign, radiusMeters);
        await this.googleSunroofService.generateArrayOverlayPng(systemDesign);
        await this.regenerateSunroofProduction(asyncQueueStore, systemDesign);
      } catch (e) {
        this.teardown(e, asyncQueueStore);
      }
    };

    if (pending) {
      asyncQueueStore.beforeRes[pending - 1] = task;

      return;
    }

    const count = asyncQueueStore.beforeRes.push(task);

    asyncQueueStore.cache.set(this.WILL_GENERATE_PNG_SYM, count);
  }

  /**
   * @param asyncQueueStore
   * @param systemDesign
   */
  private queueGenerateArrayOverlay(asyncQueueStore: IQueueStore, systemDesign: SystemDesign): void {
    const count = asyncQueueStore.beforeRes.push(() =>
      this.googleSunroofService.generateArrayOverlayPng(systemDesign).catch(e => this.teardown(e, asyncQueueStore)),
    );

    asyncQueueStore.cache.set(this.WILL_GENERATE_OVERLAY_SYM, count);
  }

  /**
   * @param asyncQueueStore
   * @param systemDesign
   * @warning When explicitly regenerating sunroof production, make sure flux data has already been generated
   */
  public queueGenerateSunroofProduction(asyncQueueStore: IQueueStore, systemDesign: SystemDesign): void {
    if (asyncQueueStore.cache.get(this.WILL_GENERATE_PNG_SYM)) return;

    const sunroofProdPending = asyncQueueStore.cache.get(this.WILL_GENERATE_SUNROOF_PRODUCTION_SYM) as number;

    const handler = () =>
      this.regenerateSunroofProduction(asyncQueueStore, systemDesign).catch(e => this.teardown(e, asyncQueueStore));

    if (sunroofProdPending) {
      asyncQueueStore.beforeRes[sunroofProdPending - 1] = handler;
      return;
    }

    const count = asyncQueueStore.beforeRes.push(handler);

    asyncQueueStore.cache.set(this.WILL_GENERATE_SUNROOF_PRODUCTION_SYM, count);
  }

  private async regenerateSunroofProduction(asyncQueueStore: IQueueStore, systemDesign: SystemDesign): Promise<void> {
    const sunroofProduction = await this.googleSunroofService.calculateProduction(systemDesign);

    const systemProduction = await this.systemProductionService.findOne(systemDesign.systemProductionId);

    if (!systemProduction) return;
    const cumulativeGenerationKWh = sunroofProduction.annualProduction;
    const { capacityKW, annualUsageKWh } = systemProduction;

    systemProduction.generationKWh = cumulativeGenerationKWh;
    systemProduction.productivity = capacityKW === 0 ? 0 : cumulativeGenerationKWh / capacityKW;
    systemProduction.offsetPercentage = annualUsageKWh > 0 ? cumulativeGenerationKWh / annualUsageKWh : 0;
    systemProduction.generationMonthlyKWh = sunroofProduction.monthlyProduction;
    systemProduction.arrayGenerationKWh = sunroofProduction.byArray.map(array => array.annualProduction);

    await Promise.all([
      systemProduction.save,
      this.sunroofHourlyProductionCalculation.calculateClippingSunroofProduction(
        systemDesign,
        systemProduction,
        sunroofProduction,
      ),
    ]);

    await this.systemDesignService.invokePINBALLSimulator(systemDesign, systemProduction);

    asyncQueueStore.transformBody = (body: ServiceResponse<SystemDesignDto>) => {
      if (!body?.data?.id) return body;
      body.data.systemProductionData = strictPlainToClass(SystemProductionDto, systemProduction.toJSON());

      return body;
    };
  }

  private canDispatchNextSystemDesignEvent(queueStore: IQueueStore): boolean {
    return !queueStore.cache.get('onNewSystemDesign');
  }

  private calculateSystemDesignRadius(systemDesignCenterBound: ICoordinate, polygons: ICoordinate[]): number {
    const longestDistance = Math.max(...polygons.map(p => calcCoordinatesDistance(systemDesignCenterBound, p))) * 1000;

    return Math.min(Math.max(25, longestDistance), 100);
  }

  private queueResaveClosestBuilding(
    asyncQueueStore: IQueueStore,
    systemDesignId: string,
    opportunityId: string,
    panelArrayId: string,
    centerLat: number,
    centerLng: number,
  ) {
    asyncQueueStore.beforeRes.push(() =>
      this.reSaveClosestBuildingByPanelArrayId(
        systemDesignId,
        opportunityId,
        panelArrayId,
        centerLat,
        centerLng,
      ).catch(e => this.teardown(e, asyncQueueStore)),
    );
  }

  private async reSaveClosestBuildingByPanelArrayId(
    systemDesignId: string,
    opportunityId: string,
    panelArrayId: string,
    centerLat: number,
    centerLng: number,
  ): Promise<void> {
    const newKey = GoogleSunroofService.BuildClosestBuildingKey(opportunityId, systemDesignId, panelArrayId);

    // Check if the cache version by lat/lng exist
    const oldKey = GoogleSunroofService.BuildClosestBuildingKey(
      opportunityId,
      systemDesignId,
      '',
      centerLat,
      centerLng,
    );

    const sunroofBucket = process.env.GOOGLE_SUNROOF_S3_BUCKET;

    const exist = await this.s3Service.hasFile(sunroofBucket!, oldKey.key);

    if (exist) {
      await this.s3Service.copySource(sunroofBucket!, oldKey.key, sunroofBucket!, newKey.key, 'private');
      await this.s3Service.deleteObject(sunroofBucket!, oldKey.key);
      return;
    }

    // Re-fetch and cache
    await this.googleSunroofService.getClosestBuilding(newKey, centerLat, centerLng).catch(e => this.teardown(e));
  }

  /**
   * Teardown logic for any failures happening in the middle of the process due to unavailable sunroof data or any kind of google sunroof error
   *
   * Write the error to stdout
   */
  private teardown<Err extends Error>(error: Err, asyncQueueStore?: IQueueStore) {
    this.logger.error(error, error?.stack);

    if (asyncQueueStore) {
      asyncQueueStore.transformBody = o => o;
    }
  }
}