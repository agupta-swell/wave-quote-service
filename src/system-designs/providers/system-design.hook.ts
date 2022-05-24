import { Injectable } from '@nestjs/common';
import { GoogleSunroofService } from 'src/shared/google-sunroof/google-sunroof.service';
import { IQueueStore } from 'src/shared/async-context/interfaces';
import { ISystemDesignSchemaHook } from './ISystemDesignSchemaHook';
import { SystemDesign, ILatLngSchema } from '../system-design.schema';

@Injectable()
export class SystemDesignHook implements ISystemDesignSchemaHook {
  constructor(private readonly googleSunroofService: GoogleSunroofService) {}

  // TODO update in WAV-1720
  dispatch(
    asyncQueueStore: IQueueStore,
    systemDesign: SystemDesign,
    initSystemDesign: { latitude: number; longitude: number; isNew: boolean },
    targetPanelArrayId: string,
    previousPanelArrayBoundPolygon: ILatLngSchema[],
    isNewPanelArray: boolean,
  ): void {
    if (!this.canDispatchNext(asyncQueueStore)) {
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

  private canDispatchNext(queueStore: IQueueStore): boolean {
    return !queueStore.cache.get('onNewSystemDesign');
  }
}
