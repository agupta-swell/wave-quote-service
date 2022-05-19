import { Injectable } from '@nestjs/common';
import { GoogleSunroofService } from 'src/shared/google-sunroof/google-sunroof.service';
import { IQueueStore } from 'src/shared/async-context/interfaces';
import { inspect } from 'util';
import { getCenterBound } from 'src/utils/calculate-coordinates';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { SystemDesign, ILatLngSchema } from '../system-design.schema';
import { ISystemDesignSchemaHook } from './ISystemDesignSchemaHook';

@Injectable()
export class SystemDesignHook implements ISystemDesignSchemaHook {
  constructor(private readonly googleSunroofService: GoogleSunroofService, private readonly s3Service: S3Service) {}

  // TODO update in WAV-1720
  dispatch(
    asyncQueueStore: IQueueStore,
    systemDesign: SystemDesign,
    initSystemDesign: { latitude: number; longitude: number; isNew: boolean },
    targetPanelArrayId: string,
    previousPanelArrayBoundPolygon: ILatLngSchema[],
    isNewPanelArray: boolean,
    newPanelArrayBoundPolygon: ILatLngSchema[],
  ): void {
    if (isNewPanelArray) {
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

    if (!this.canDispatchNextSystemDesignEvent(asyncQueueStore)) {
      return;
    }

    // Queue up all relevants task when new system design is created
    if (initSystemDesign.isNew) {
      this.queueGenerateHeatMap(asyncQueueStore, systemDesign);
      asyncQueueStore.cache.set('onNewSystemDesign', true);
    }
  }

  private queueGenerateHeatMap(asyncQueueStore: IQueueStore, systemDesign: SystemDesign): void {
    asyncQueueStore.beforeRes.push(() => this.googleSunroofService.generateHeatmapPngs(systemDesign));
  }

  private canDispatchNextSystemDesignEvent(queueStore: IQueueStore): boolean {
    return !queueStore.cache.get('onNewSystemDesign');
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
      return;
    }

    // Re-fetch and cache
    await this.googleSunroofService.getClosestBuilding(newKey, centerLat, centerLng);
  }
}
