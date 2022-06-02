import { Injectable } from '@nestjs/common';
import { GoogleSunroofService } from 'src/shared/google-sunroof/google-sunroof.service';
import { IQueueStore } from 'src/shared/async-context/interfaces';
import { calcCoordinatesDistance, getCenterBound, ICoordinate } from 'src/utils/calculate-coordinates';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { isEqual } from 'lodash';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SystemDesign, ILatLngSchema, PURE_SYSTEM_DESIGN } from '../system-design.schema';
import { InitSystemDesign, ISystemDesignSchemaHook } from './ISystemDesignSchemaHook';

@Injectable()
export class SystemDesignHook implements ISystemDesignSchemaHook {
  constructor(
    private readonly googleSunroofService: GoogleSunroofService,
    private readonly s3Service: S3Service,
    // @ts-ignore
    @InjectModel(PURE_SYSTEM_DESIGN) private readonly systemDesignModel: Model<SystemDesign>,
  ) {}

  private WILL_GENERATE_PNG_SYM = Symbol('willGeneratePng');

  private WILL_GENERATE_OVERLAY_SYM = Symbol('willGenerateOverlay');

  dispatch(
    asyncQueueStore: IQueueStore,
    systemDesign: SystemDesign,
    initSystemDesign: InitSystemDesign,
    targetPanelArrayId: string,
    previousPanelArrayBoundPolygon: ILatLngSchema[],
    isNewPanelArray: boolean,
    newPanelArrayBoundPolygon: ILatLngSchema[],
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
      isNewPanelArray,
      newPanelArrayBoundPolygon,
    );
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
    isNewPanelArray: boolean,
    newPanelArrayBoundPolygon: ILatLngSchema[],
  ) {
    if (initSystemDesign.isNew) return;

    if (
      asyncQueueStore.cache.get(this.WILL_GENERATE_OVERLAY_SYM) ||
      asyncQueueStore.cache.get(this.WILL_GENERATE_PNG_SYM)
    ) {
      return;
    }

    if (isEqual(previousPanelArrayBoundPolygon, newPanelArrayBoundPolygon)) {
      return;
    }

    let { latitude, longitude, radius: currentRadius } = systemDesign.sunroofTiffMeta$!;

    if (!latitude || !longitude || !currentRadius) {
      const { latitude: initLat, longitude: initLng, polygons } = initSystemDesign;

      currentRadius = this.calculateSystemDesignRadius(
        {
          lat: latitude,
          lng: longitude,
        },
        polygons,
      );

      latitude = initLat;
      longitude = initLng;
    }

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

    const currentCenterToNewPolygonsRadius = this.calculateSystemDesignRadius(
      {
        lat: latitude,
        lng: longitude,
      },
      newPolygons,
    );

    if (currentCenterToNewPolygonsRadius > currentRadius) {
      this.queueGeneratePngs(asyncQueueStore, systemDesign, newRadius);

      return;
    }

    this.queueGenerateArrayOverlay(asyncQueueStore, systemDesign, { lat: latitude, lng: longitude });
  }

  private queueGeneratePngs(asyncQueueStore: IQueueStore, systemDesign: SystemDesign, radiusMeters: number): void {
    const pending = asyncQueueStore.cache.get(this.WILL_GENERATE_PNG_SYM) as number;

    const overlayPending = asyncQueueStore.cache.get(this.WILL_GENERATE_OVERLAY_SYM) as number;

    if (overlayPending) {
      asyncQueueStore.beforeRes[overlayPending - 1] = async () => null;
    }

    const task = async () => {
      await this.googleSunroofService.generateHeatmapPngs(systemDesign, radiusMeters);
      await this.systemDesignModel.updateOne(
        { _id: systemDesign._id },
        {
          sunroofTiffMeta$: {
            latitude: systemDesign.latitude,
            longitude: systemDesign.longitude,
            radius: radiusMeters,
          },
        },
      );
      await this.googleSunroofService.generateArrayOverlayPng(systemDesign);
    };

    if (pending) {
      asyncQueueStore.beforeRes[pending - 1] = task;

      return;
    }

    const count = asyncQueueStore.beforeRes.push(task);

    asyncQueueStore.cache.set(this.WILL_GENERATE_PNG_SYM, count);
  }

  /**
   * Pass in `centerBound` to force draw the overlay png on the tiff generated with that given center point
   * @param asyncQueueStore
   * @param systemDesign
   * @param centerBound
   */
  private queueGenerateArrayOverlay(
    asyncQueueStore: IQueueStore,
    systemDesign: SystemDesign,
    centerBound?: ILatLngSchema,
  ): void {
    const count = asyncQueueStore.beforeRes.push(() =>
      this.googleSunroofService.generateArrayOverlayPng(systemDesign, centerBound),
    );
    asyncQueueStore.cache.set(this.WILL_GENERATE_OVERLAY_SYM, count);
  }

  private canDispatchNextSystemDesignEvent(queueStore: IQueueStore): boolean {
    return !queueStore.cache.get('onNewSystemDesign');
  }

  private calculateSystemDesignRadius(systemDesignCenterBound: ICoordinate, polygons: ICoordinate[]): number {
    const longestDistance = Math.max(...polygons.map(p => calcCoordinatesDistance(systemDesignCenterBound, p))) * 1000;

    return Math.min(25, Math.max(100, longestDistance));
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
      this.reSaveClosestBuildingByPanelArrayId(systemDesignId, opportunityId, panelArrayId, centerLat, centerLng),
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
    await this.googleSunroofService.getClosestBuilding(newKey, centerLat, centerLng);
  }
}
